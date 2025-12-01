from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import csv
import json
import io
from datetime import datetime
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import base64

router = APIRouter(prefix="/api/export", tags=["export"])

class ExportService:
    
    @staticmethod
    def prepare_medicine_data(medicines: List[Any], include_details: bool = True) -> List[Dict]:
        export_data = []
        for medicine in medicines:
            data = {
                "Medicine Name": medicine.Name,
                "Category": medicine.category.Name if medicine.category else "N/A",
                "Manufacturer": medicine.manufacturer.Name if medicine.manufacturer else "N/A",
                "Price": f"${medicine.Price:.2f}" if medicine.Price else "N/A",
                "Dosage Form": medicine.DosageForm or "N/A",
            }
            
            if include_details:
                data.update({
                    "Description": medicine.Description or "N/A",
                    "Uses": medicine.Uses or "N/A",
                    "Side Effects": medicine.SideEffects or "N/A",
                    "Ingredients": ", ".join([ing.Name for ing in medicine.ingredients]) if hasattr(medicine, 'ingredients') else "N/A"
                })
            
            export_data.append(data)
        
        return export_data
    
    @staticmethod
    def generate_statistics(medicines: List[Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        total_medicines = len(medicines)
        
        categories = {}
        manufacturers = {}
        price_stats = []
        
        for med in medicines:
            cat_name = med.category.Name if med.category else "Unknown"
            categories[cat_name] = categories.get(cat_name, 0) + 1
            
            mfr_name = med.manufacturer.Name if med.manufacturer else "Unknown"
            manufacturers[mfr_name] = manufacturers.get(mfr_name, 0) + 1
            
            if med.Price:
                price_stats.append(float(med.Price))
        
        stats = {
            "total_medicines": total_medicines,
            "filters_applied": filters,
            "export_timestamp": datetime.now().isoformat(),
            "category_distribution": categories,
            "manufacturer_distribution": manufacturers,
            "top_5_categories": sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5],
            "top_5_manufacturers": sorted(manufacturers.items(), key=lambda x: x[1], reverse=True)[:5],
        }
        
        if price_stats:
            stats["price_statistics"] = {
                "average_price": sum(price_stats) / len(price_stats),
                "min_price": min(price_stats),
                "max_price": max(price_stats),
                "total_medicines_with_price": len(price_stats)
            }
        
        return stats


@router.post("/csv")
async def export_to_csv(filters: Dict[str, Any], include_details: bool = Query(True)):
    try:
        medicines = []
        
        export_data = ExportService.prepare_medicine_data(medicines, include_details)
        
        output = io.StringIO()
        if export_data:
            fieldnames = export_data[0].keys()
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(export_data)
        
        output.seek(0)
        filename = f"medicine_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting to CSV: {str(e)}")


@router.post("/json")
async def export_to_json(filters: Dict[str, Any], include_details: bool = Query(True), include_statistics: bool = Query(True)):
    try:
        medicines = []
        
        export_data = ExportService.prepare_medicine_data(medicines, include_details)
        
        response_data = {
            "export_info": {
                "timestamp": datetime.now().isoformat(),
                "total_records": len(export_data),
                "filters_applied": filters
            },
            "data": export_data
        }
        
        if include_statistics:
            response_data["statistics"] = ExportService.generate_statistics(medicines, filters)
        
        filename = f"medicine_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            io.BytesIO(json.dumps(response_data, indent=2).encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting to JSON: {str(e)}")


@router.post("/excel")
async def export_to_excel(filters: Dict[str, Any], include_details: bool = Query(True), include_charts: bool = Query(True)):
    try:
        medicines = []
        
        export_data = ExportService.prepare_medicine_data(medicines, include_details)
        statistics = ExportService.generate_statistics(medicines, filters)
        
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df = pd.DataFrame(export_data)
            df.to_excel(writer, sheet_name='Medicine Data', index=False)
            
            stats_data = []
            stats_data.append(['Export Information', ''])
            stats_data.append(['Total Medicines', statistics['total_medicines']])
            stats_data.append(['Export Timestamp', statistics['export_timestamp']])
            stats_data.append(['', ''])
            
            stats_data.append(['Filters Applied', ''])
            for key, value in filters.items():
                stats_data.append([key, str(value)])
            stats_data.append(['', ''])
            
            stats_data.append(['Category Distribution', 'Count'])
            for category, count in statistics['category_distribution'].items():
                stats_data.append([category, count])
            stats_data.append(['', ''])
            
            stats_data.append(['Top Manufacturers', 'Medicines Count'])
            for manufacturer, count in statistics['top_5_manufacturers']:
                stats_data.append([manufacturer, count])
            
            if 'price_statistics' in statistics:
                stats_data.append(['', ''])
                stats_data.append(['Price Statistics', ''])
                stats_data.append(['Average Price', f"${statistics['price_statistics']['average_price']:.2f}"])
                stats_data.append(['Min Price', f"${statistics['price_statistics']['min_price']:.2f}"])
                stats_data.append(['Max Price', f"${statistics['price_statistics']['max_price']:.2f}"])
            
            stats_df = pd.DataFrame(stats_data)
            stats_df.to_excel(writer, sheet_name='Statistics', index=False, header=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Medicine Data']
            
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
                worksheet.set_column(col_num, col_num, 15)
        
        output.seek(0)
        filename = f"medicine_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting to Excel: {str(e)}")


@router.post("/pdf")
async def export_to_pdf(filters: Dict[str, Any], include_details: bool = Query(False), include_charts: bool = Query(True), chart_images: Optional[List[str]] = None):
    try:
        medicines = []
        
        export_data = ExportService.prepare_medicine_data(medicines, include_details)
        statistics = ExportService.generate_statistics(medicines, filters)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f4788'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1f4788'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        title = Paragraph("Medicine Data Export Report", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        info_text = f"""
        <b>Export Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>Total Medicines:</b> {statistics['total_medicines']}<br/>
        <b>Filters Applied:</b> {', '.join([f"{k}: {v}" for k, v in filters.items()]) if filters else 'None'}
        """
        elements.append(Paragraph(info_text, styles['Normal']))
        elements.append(Spacer(1, 20))
        
        elements.append(Paragraph("Summary Statistics", heading_style))
        elements.append(Spacer(1, 12))
        
        if statistics['top_5_categories']:
            elements.append(Paragraph("<b>Top 5 Categories</b>", styles['Heading3']))
            cat_data = [['Category', 'Count']]
            cat_data.extend(statistics['top_5_categories'])
            
            cat_table = Table(cat_data, colWidths=[4*inch, 1.5*inch])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(cat_table)
            elements.append(Spacer(1, 20))
        
        if statistics['top_5_manufacturers']:
            elements.append(Paragraph("<b>Top 5 Manufacturers</b>", styles['Heading3']))
            mfr_data = [['Manufacturer', 'Medicines Count']]
            mfr_data.extend(statistics['top_5_manufacturers'])
            
            mfr_table = Table(mfr_data, colWidths=[4*inch, 1.5*inch])
            mfr_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(mfr_table)
            elements.append(Spacer(1, 20))
        
        if 'price_statistics' in statistics:
            elements.append(Paragraph("<b>Price Statistics</b>", styles['Heading3']))
            price_text = f"""
            Average Price: ${statistics['price_statistics']['average_price']:.2f}<br/>
            Min Price: ${statistics['price_statistics']['min_price']:.2f}<br/>
            Max Price: ${statistics['price_statistics']['max_price']:.2f}<br/>
            """
            elements.append(Paragraph(price_text, styles['Normal']))
            elements.append(Spacer(1, 20))
        
        if include_charts and chart_images:
            elements.append(PageBreak())
            elements.append(Paragraph("Data Visualizations", heading_style))
            elements.append(Spacer(1, 12))
            
            for idx, chart_base64 in enumerate(chart_images):
                try:
                    image_data = base64.b64decode(chart_base64.split(',')[1] if ',' in chart_base64 else chart_base64)
                    image = Image(io.BytesIO(image_data), width=5*inch, height=3*inch)
                    elements.append(image)
                    elements.append(Spacer(1, 20))
                except Exception as e:
                    elements.append(Paragraph(f"<i>Chart {idx + 1} could not be rendered</i>", styles['Italic']))
                    elements.append(Spacer(1, 20))
        
        if not include_details and len(export_data) > 0:
            elements.append(PageBreak())
            elements.append(Paragraph("Medicine Data", heading_style))
            elements.append(Spacer(1, 12))
            
            table_data = [['Name', 'Category', 'Manufacturer', 'Price']]
            for item in export_data[:50]:
                table_data.append([
                    item.get('Medicine Name', 'N/A')[:30],
                    item.get('Category', 'N/A')[:20],
                    item.get('Manufacturer', 'N/A')[:20],
                    item.get('Price', 'N/A')
                ])
            
            data_table = Table(table_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1*inch])
            data_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(data_table)
            
            if len(export_data) > 50:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<i>Showing 50 of {len(export_data)} medicines. Download CSV or Excel for complete data.</i>", styles['Italic']))
        
        doc.build(elements)
        
        buffer.seek(0)
        filename = f"medicine_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting to PDF: {str(e)}")


@router.get("/formats")
async def get_available_formats():
    return {
        "formats": [
            {
                "name": "CSV",
                "extension": ".csv",
                "description": "Comma-separated values, best for data analysis",
                "supports_charts": False,
                "supports_statistics": False,
                "file_size": "small"
            },
            {
                "name": "JSON",
                "extension": ".json",
                "description": "JavaScript Object Notation, best for API integration",
                "supports_charts": False,
                "supports_statistics": True,
                "file_size": "medium"
            },
            {
                "name": "Excel",
                "extension": ".xlsx",
                "description": "Microsoft Excel format with multiple sheets",
                "supports_charts": True,
                "supports_statistics": True,
                "file_size": "medium"
            },
            {
                "name": "PDF",
                "extension": ".pdf",
                "description": "Portable Document Format, best for reports",
                "supports_charts": True,
                "supports_statistics": True,
                "file_size": "large"
            }
        ]
    }