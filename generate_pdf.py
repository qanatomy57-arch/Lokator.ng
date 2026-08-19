"""
LOKATOR.NG — Strategic Business Plan, Monetization & Customer Acquisition PDF Generator
Builds a high-resolution, multi-page executive PDF report using ReportLab.
"""

import os
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = r"c:\All workspace\Locator.NG\lokator\Lokator_Executive_Strategy_and_Monetization_Blueprint.pdf"

# Lokator Brand Color Palette
PRIMARY_GREEN = colors.HexColor("#006B3F")
DARK_GREEN    = colors.HexColor("#024729")
LIGHT_GREEN   = colors.HexColor("#DCFCE7")
GOLD          = colors.HexColor("#D4AF37")
LIGHT_GOLD    = colors.HexColor("#FEF08A")
DARK_GOLD     = colors.HexColor("#854D0E")
DARK_TEXT     = colors.HexColor("#0F172A")
MUTED_TEXT    = colors.HexColor("#475569")
BORDER_COLOR  = colors.HexColor("#E2E8F0")
BG_LIGHT      = colors.HexColor("#F8FAFC")
WHITE         = colors.HexColor("#FFFFFF")

class NumberedCanvas(canvas.Canvas):
    """Canvas that performs a two-pass calculation to draw 'Page X of Y' footer."""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#94A3B8"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, A4[1] - 25, "Lokator.NG — Executive Commercial Blueprint & Monetization Guide")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(36, A4[1] - 30, A4[0] - 36, A4[1] - 30)

        # Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(36, 32, A4[0] - 36, 32)
        
        self.drawString(36, 20, "Lokator.NG © 2026 • Confidential Strategic Document • Made with ❤️ in Nigeria 🇳🇬")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 20, page_str)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=WHITE,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#E2E8F0"),
        spaceAfter=10
    )

    badge_style = ParagraphStyle(
        'Badge',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#FCD34D"),
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#CBD5E1")
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=PRIMARY_GREEN,
        spaceBefore=14,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=DARK_TEXT,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=DARK_TEXT,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=WHITE
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=DARK_TEXT
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=DARK_TEXT
    )

    callout_style = ParagraphStyle(
        'Callout',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=DARK_TEXT
    )

    story = []
    content_width = A4[0] - 72 # 595.27 - 72 = 523.27 pt

    # =========================================================================
    # PAGE 1: COVER HEADER & OVERVIEW
    # =========================================================================
    cover_cell = [
        Paragraph("🇳🇬 STRATEGIC BUSINESS & MONETIZATION BLUEPRINT", badge_style),
        Paragraph("Lokator.NG — Locate Skilled Hands Near You", title_style),
        Paragraph("Executive Platform Summary, Commercial Monetization Blueprint, Go-To-Market Strategy & Scale Roadmap for Nigeria's Premier Hyperlocal Artisan Marketplace.", subtitle_style),
        Paragraph("<b>Target Market:</b> 36 States in Nigeria (Lagos, Abuja & PH Focus) &nbsp;|&nbsp; <b>Model:</b> Hyperlocal Service Discovery & SaaS &nbsp;|&nbsp; <b>Status:</b> Ready for Launch", meta_style)
    ]
    cover_table = Table([[cover_cell]], colWidths=[content_width])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_GREEN),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 18),
        ('RIGHTPADDING', (0, 0), (-1, -1), 18),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 10))

    # KPI Stat Boxes
    stat1 = [Paragraph("<font size=14 color='#006B3F'><b>15+</b></font>", body_style), Paragraph("<font size=7 color='#64748B'><b>SERVICE CATEGORIES</b></font>", body_style)]
    stat2 = [Paragraph("<font size=14 color='#006B3F'><b>₦0 FREE</b></font>", body_style), Paragraph("<font size=7 color='#64748B'><b>CUSTOMER ACCESS FEE</b></font>", body_style)]
    stat3 = [Paragraph("<font size=14 color='#006B3F'><b>₦10M+</b></font>", body_style), Paragraph("<font size=7 color='#64748B'><b>PROJECTED YEAR 1 MRR</b></font>", body_style)]
    stat4 = [Paragraph("<font size=14 color='#006B3F'><b>36 CITIES</b></font>", body_style), Paragraph("<font size=7 color='#64748B'><b>NATIONWIDE COVERAGE</b></font>", body_style)]
    
    stat_table = Table([[stat1, stat2, stat3, stat4]], colWidths=[content_width/4.0]*4)
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 10))

    # Section 1: Product Summary
    story.append(Paragraph("1. Executive Summary & Problem-Solution Fit", h1_style))
    story.append(Paragraph("<b>Lokator.NG</b> is a production-ready, location-based service marketplace web application built specifically for the Nigerian market. It addresses the critical friction in how Nigerian households and businesses hire skilled tradespeople (electricians, plumbers, beauty/nail techs, mechanics, tailors, carpenters, cleaners, etc.).", body_style))
    
    problem_box = [
        Paragraph("<b>⚠️ The Core Problem in Nigeria:</b>", h2_style),
        Paragraph("• Consumers rely on slow, uncertain word-of-mouth or risky roadside searches.<br/>• Emergency home/car repairs take hours or days to find reliable technicians.<br/>• Unpredictable pricing, zero transparency, and rampant fears of theft or unqualified artisans.<br/>• Traditional directories charge heavy middleman commissions that discourage both sides.", body_style)
    ]
    solution_box = [
        Paragraph("<b>💡 The Lokator.NG Solution:</b>", h2_style),
        Paragraph("• <b>GPS Proximity Ranking:</b> Shows verified providers nearest to the user in real-time.<br/>• <b>Direct 1-Click Connection:</b> WhatsApp chat link and instant phone dial with zero middleman fee.<br/>• <b>NIN Identity Verification:</b> Trust badges verified against government ID databases.<br/>• <b>100% Free for Customers:</b> Creates massive organic search volume and viral word-of-mouth.", body_style)
    ]
    
    ps_table = Table([[problem_box, solution_box]], colWidths=[content_width*0.48, content_width*0.48])
    ps_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#FEF2F2")),
        ('BACKGROUND', (1, 0), (1, 0), LIGHT_GREEN),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor("#FCA5A5")),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor("#86EFAC")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(ps_table)
    story.append(Spacer(1, 10))

    # Section 2: Core Platform Capabilities
    story.append(Paragraph("2. Technical & Feature Capabilities", h1_style))
    story.append(Paragraph("• <b>Cinematic 9-Scene Hero Video Scroll:</b> Full-screen vertical video sequence showcasing core trades (electrician, plumber, nail tech, tailor, auto mechanic, carpenter, cleaner, community). Built with IntersectionObserver and CSS scroll-snap.", bullet_style))
    story.append(Paragraph("• <b>Geolocation Radius Engine:</b> Native browser GPS coordinates calculate distances accurately, placing the closest verified provider at the top of search results.", bullet_style))
    story.append(Paragraph("• <b>PostgreSQL & Supabase Architecture:</b> Row Level Security (RLS), dynamic reviews, verified artisan portfolios, and instant response-time indicators.", bullet_style))
    story.append(Paragraph("• <b>Mobile-First Ultra-Lightweight Build:</b> Optimized for low-latency 3G/4G networks across standard Android and iOS devices in Nigeria.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: COMMERCIAL MONETIZATION MODEL
    # =========================================================================
    story.append(Paragraph("3. Commercial Monetization Strategy (6 Revenue Streams)", h1_style))
    story.append(Paragraph("Lokator.NG operates a <b>Freemium Marketplace + SaaS Model</b>. By keeping customer discovery 100% free, we build massive search traffic, then monetize provider visibility, credibility badges, premium business tools, and corporate partnerships.", body_style))
    story.append(Spacer(1, 4))

    monetization_data = [
        [Paragraph("<b>Revenue Stream</b>", table_header_style), Paragraph("<b>Price Point</b>", table_header_style), Paragraph("<b>Target Segment</b>", table_header_style), Paragraph("<b>Value Proposition Delivered</b>", table_header_style)],
        
        [Paragraph("<b>1. Verified Pro Tier</b>", table_cell_bold),
         Paragraph("<font color='#006B3F'><b>₦3,000 / mo</b><br/>(₦30,000/yr)</font>", table_cell_style),
         Paragraph("Individual Artisans & Solo Tradespeople", table_cell_style),
         Paragraph("• Verified Green Badge ✓<br/>• 2x Search Ranking Boost<br/>• NIN-Verified Trust Seal<br/>• 3x more customer inquiries", table_cell_style)],

        [Paragraph("<b>2. Premium Pro Tier</b>", table_cell_bold),
         Paragraph("<font color='#854D0E'><b>₦8,000 / mo</b><br/>(₦80,000/yr)</font>", table_cell_style),
         Paragraph("Established Workshops, Salons & Master Pros", table_cell_style),
         Paragraph("• Top Featured Spotlight<br/>• Photo Portfolio Gallery<br/>• Monthly Analytics Dashboard<br/>• Priority Job Lead Alerts", table_cell_style)],

        [Paragraph("<b>3. One-Time NIN Vetting Fee</b>", table_cell_bold),
         Paragraph("<font color='#075985'><b>₦2,500 – ₦5,000</b><br/>(One-time)</font>", table_cell_style),
         Paragraph("All Registering Providers", table_cell_style),
         Paragraph("Covers official ID verification, manual background check, and issuing official Lokator Verified Credential.", table_cell_style)],

        [Paragraph("<b>4. LGA / Category Boosts</b>", table_cell_bold),
         Paragraph("<font color='#006B3F'><b>₦1,500 / 7 days</b></font>", table_cell_style),
         Paragraph("Artisans Promoting Local Specials", table_cell_style),
         Paragraph("Pins the provider to the #1 sponsored slot in high-demand areas (e.g. Lekki Phase 1, Ikeja GRA, Wuse 2).", table_cell_style)],

        [Paragraph("<b>5. Emergency Dispatch Fee</b>", table_cell_bold),
         Paragraph("<font color='#854D0E'><b>₦500 – ₦1,500</b><br/>per emergency</font>", table_cell_style),
         Paragraph("Night / Weekend Urgent Callouts", table_cell_style),
         Paragraph("Guaranteed 15-minute emergency artisan response for burst pipes, electrical short circuits, and vehicle breakdown.", table_cell_style)],

        [Paragraph("<b>6. B2B Estate Facilities Portals</b>", table_cell_bold),
         Paragraph("<font color='#075985'><b>₦50,000 – ₦250k</b><br/>/month per estate</font>", table_cell_style),
         Paragraph("Gated Estates & Facility Managers", table_cell_style),
         Paragraph("Curated, vetted artisan pool with security clearance SLAs for residents associations (e.g. 1004, Magodo, Chevron).", table_cell_style)]
    ]

    m_table = Table(monetization_data, colWidths=[content_width*0.23, content_width*0.19, content_width*0.24, content_width*0.34])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_GREEN),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))

    # Revenue Projection Callout
    callout_content = [
        Paragraph("<b>📊 Realistic 12-Month Financial Model (Lagos + Abuja Base):</b>", h2_style),
        Paragraph("Assuming <b>10,000 active registered providers</b> within Year 1:<br/>"
                  "• <b>Verified Tier (15% conversion = 1,500 @ ₦3,000/mo):</b> ₦4,500,000 / month<br/>"
                  "• <b>Premium Tier (5% conversion = 500 @ ₦8,000/mo):</b> ₦4,000,000 / month<br/>"
                  "• <b>Search Boosts & ID Vetting Fees:</b> ₦1,500,000 / month<br/>"
                  "• <b>Total Projected Monthly Recurring Revenue (MRR):</b> <font color='#006B3F'><b>₦10,000,000+ / month</b> (~₦120,000,000 Annual Run-Rate)</font> with over 80% gross margins.", callout_style)
    ]
    callout_box = Table([[callout_content]], colWidths=[content_width])
    callout_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GOLD),
        ('BOX', (0, 0), (-1, -1), 1, GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(callout_box)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: ACQUISITION BLUEPRINT & GROWTH ENGINE
    # =========================================================================
    story.append(Paragraph("4. Supply Acquisition: Onboarding 5,000+ Artisans", h1_style))
    story.append(Paragraph("A hyperlocal marketplace wins on supply density. The strategy to recruit artisans rapidly with minimal cash burn:", body_style))

    sup1 = [Paragraph("<b>🤝 Trade Union Partnerships</b>", h2_style), Paragraph("Partner with artisan associations (Mechanics Union, Tailors Guild, Electricians Association). Offer executive leaders and first 50 members free 3-month Verified Pro status in exchange for bulk member registration.", body_style)]
    sup2 = [Paragraph("<b>🚶 Field Scout Street Teams</b>", h2_style), Paragraph("Deploy youth reps with smartphones into artisan clusters (Ladipo, Computer Village, Tejuosho, Wuse). Onboard artisans on-the-spot in under 3 minutes, paying field agents ₦500 per verified profile.", body_style)]
    sup3 = [Paragraph("<b>📲 WhatsApp Viral Referral</b>", h2_style), Paragraph("Built-in incentive: <i>'Refer 3 fellow master artisans to Lokator, unlock 1 month of FREE Verified Badge (worth ₦3,000).'</i> Triggers rapid viral peer loops in trade groups.", body_style)]
    sup4 = [Paragraph("<b>🎁 Zero-Friction Freemium Entry</b>", h2_style), Paragraph("Basic listing is 100% free. Once an artisan gets their first 2 real customer calls through Lokator, the system automatically prompts the upgrade to 2x their incoming jobs.", body_style)]

    sup_table = Table([[sup1, sup2], [sup3, sup4]], colWidths=[content_width*0.48, content_width*0.48])
    sup_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(sup_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("5. Demand Acquisition: Driving Millions of Customer Searches", h1_style))

    dem1 = [Paragraph("<b>🎬 TikTok & Reels Relatable Skits</b>", h2_style), Paragraph("Create viral skits on relatable Nigerian repair nightmares (e.g. <i>'When your AC stops working in traffic'</i> or <i>'When the carpenter goes missing 2 days to your wedding'</i>), ending with Lokator GPS solution.", body_style)]
    dem2 = [Paragraph("<b>🔎 Local Intent Search SEO</b>", h2_style), Paragraph("Dominate hyper-specific high-intent keywords: <i>'emergency plumber Lekki'</i>, <i>'car mechanic near Ikeja'</i>, <i>'nail technician Victoria Island'</i>, landing directly on pre-filtered results.", body_style)]
    dem3 = [Paragraph("<b>🏡 Estate WhatsApp Channels</b>", h2_style), Paragraph("Pitch Lokator to residential estate executives (Magodo, Gwarinpa, Lekki Phase 1) as the official security-verified standard for bringing outside workmen through estate gates.", body_style)]
    dem4 = [Paragraph("<b>🏷️ Point-of-Sale QR Code Flyers</b>", h2_style), Paragraph("Place QR code counter stickers at paint shops, electrical hardware stores, auto spare parts markets: <i>'Need someone to install this? Scan to find the nearest verified artisan.'</i>", body_style)]

    dem_table = Table([[dem1, dem2], [dem3, dem4]], colWidths=[content_width*0.48, content_width*0.48])
    dem_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(dem_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: 90-DAY EXECUTION ROADMAP & EXIT STRATEGY
    # =========================================================================
    story.append(Paragraph("6. 90-Day Go-To-Market Execution Plan", h1_style))

    roadmap_data = [
        [Paragraph("<b>Phase & Window</b>", table_header_style), Paragraph("<b>Target Goals</b>", table_header_style), Paragraph("<b>Key Tactical Milestones</b>", table_header_style)],
        
        [Paragraph("<b>Phase 1: Seed & Launch</b><br/>(Days 1 – 30)", table_cell_bold),
         Paragraph("• 500 Seed Artisans<br/>• 5 core Lagos hubs<br/>• 5,000 searches", table_cell_style),
         Paragraph("• Onboard 500 artisans across Surulere, Ikeja, Lekki, Yaba, VI.<br/>• Connect Paystack / Flutterwave automated subscription recurring billing.<br/>• Launch social channels with the 9 cinematic video reels.", table_cell_style)],

        [Paragraph("<b>Phase 2: Growth & Viral</b><br/>(Days 31 – 60)", table_cell_bold),
         Paragraph("• 2,500 Providers<br/>• Lagos + Abuja active<br/>• 35,000 searches", table_cell_style),
         Paragraph("• Deploy WhatsApp Provider Referral engine.<br/>• Run localized Google Search Ads for emergency repair terms.<br/>• Secure first 3 residential estate community endorsements.", table_cell_style)],

        [Paragraph("<b>Phase 3: Monetize & Scale</b><br/>(Days 61 – 90)", table_cell_bold),
         Paragraph("• 5,000+ Providers<br/>• ₦2.5M Initial MRR<br/>• Port Harcourt Launch", table_cell_style),
         Paragraph("• Convert first 500 paying Verified & Premium subscribers.<br/>• Launch B2B Facilities Management Pilot.<br/>• Expand directory coverage to Ibadan, Port Harcourt, and Kano.", table_cell_style)]
    ]

    r_table = Table(roadmap_data, colWidths=[content_width*0.25, content_width*0.25, content_width*0.50])
    r_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_GREEN),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
    ]))
    story.append(r_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("7. Valuation & Strategic Acquisition / Exit Potential", h1_style))
    story.append(Paragraph("If the goal is to build, scale, and sell Lokator.NG to a major African fintech, super-app, or global marketplace fund (e.g. <b>Moniepoint, OPay, Piggyvest, Eden Life, Jumia, PalmPay</b>):", body_style))

    exit_data = [
        [Paragraph("<b>Maturity Stage</b>", table_header_style), Paragraph("<b>Key Marketplace Metrics</b>", table_header_style), Paragraph("<b>Annual Run-Rate (ARR)</b>", table_header_style), Paragraph("<b>Projected Acquisition Valuation</b>", table_header_style)],
        
        [Paragraph("<b>Seed / Traction</b>", table_cell_bold),
         Paragraph("3,000 Providers · 25k Monthly Searches", table_cell_style),
         Paragraph("₦18,000,000 (~$12,000 USD)", table_cell_style),
         Paragraph("<b>$150,000 – $350,000 USD</b> (6x–10x ARR)", table_cell_style)],

        [Paragraph("<b>Growth Stage</b>", table_cell_bold),
         Paragraph("15,000 Providers · 150k Monthly Searches", table_cell_style),
         Paragraph("₦120,000,000 (~$80,000 USD)", table_cell_style),
         Paragraph("<b>$600,000 – $1,200,000 USD</b> (8x–12x ARR)", table_cell_style)],

        [Paragraph("<b>National Dominance</b>", table_cell_bold),
         Paragraph("50,000+ Providers in 36 States", table_cell_style),
         Paragraph("₦450,000,000 (~$300,000 USD)", table_cell_style),
         Paragraph("<b>$2,500,000 – $5,000,000 USD</b> (Strategic M&A)", table_cell_style)]
    ]

    e_table = Table(exit_data, colWidths=[content_width*0.22, content_width*0.30, content_width*0.24, content_width*0.24])
    e_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_GREEN),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
    ]))
    story.append(e_table)
    story.append(Spacer(1, 10))

    # Next Steps Callout
    final_box = [
        Paragraph("<b>🚀 The Immediate 3-Step Execution Plan:</b>", h2_style),
        Paragraph("1. <b>Activate Payment Gateway:</b> Integrate Paystack / Flutterwave to automate the ₦3,000/mo & ₦8,000/mo subscription checkouts.<br/>"
                  "2. <b>Deploy 5 Field Agents:</b> Collect the first 500 artisan profiles with photos and NIN verification in Lagos.<br/>"
                  "3. <b>Launch Hyperlocal Ad Push:</b> Run targeted Meta / Google ads highlighting the 1-click WhatsApp connection.", body_style)
    ]
    fb_table = Table([[final_box]], colWidths=[content_width])
    fb_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GREEN),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY_GREEN),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(fb_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Successfully Generated at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
