// ===== LOKATOR — PROVIDERS DATABASE & REVIEW STORE =====
// Shared dataset for Search, Profile, and Reviews across Lokator.NG

(function (global) {
  'use strict';

  const DEFAULT_PROVIDERS_DATA = [
    {
      id: 1,
      name: "Adebayo Okafor",
      trade: "Master Electrician & Solar Installer",
      category: "Electrician",
      slug: "electrician",
      city: "Lagos",
      area: "Surulere, Lagos",
      address: "14 Ogunlana Drive, Surulere, Lagos",
      distanceKm: 0.8,
      rating: 4.9,
      reviewsCount: 214,
      experienceYrs: 8,
      completedJobs: 540,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348012345678",
      avatarBg: "linear-gradient(135deg, #006B3F, #059669)",
      badgeTitle: "NIN & COREN Certified",
      responseTime: "~15 mins",
      bio: "Certified electrical engineer with 8+ years hands-on experience in high-end domestic conduit wiring, 5kVA–15kVA solar inverter systems, prepaid meter diagnostics, distribution board rewiring, and 24/7 emergency short-circuit intervention.",
      skills: ["Home Conduit Wiring", "Inverter & Solar Setup", "Fault Detection", "Distribution Boards", "Generator Changeover", "Prepaid Meter Fixing"],
      startingPrice: "₦4,000 / inspection",
      workingHours: {
        weekday: "7:30 AM – 7:00 PM",
        saturday: "8:30 AM – 6:00 PM",
        sunday: "Emergency Callouts (24/7)"
      },
      pricingGuide: [
        { item: "Initial Fault Diagnostic & Site Inspection", price: "₦4,000" },
        { item: "Single Room / Flat Complete Rewiring", price: "₦25,000 – ₦60,000" },
        { item: "Inverter & Battery Bank Installation (3.5kVA–10kVA)", price: "₦35,000 – ₦85,000" },
        { item: "Automatic Changeover Switch Installation", price: "₦15,000" },
        { item: "Emergency Short Circuit / Burnt Cable Repair", price: "₦8,000 – ₦18,000" }
      ],
      portfolio: [
        {
          id: "p1-1",
          title: "5kVA Hybrid Solar Inverter Installation",
          category: "Solar & Inverter",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Clean rack-mounted 5kVA inverter with lithium battery bank replacing messy generator cabling in 4-bedroom duplex.",
          accentColor: "#059669",
          icon: "☀️"
        },
        {
          id: "p1-2",
          title: "Complete 3-Bedroom Flat Conduit Rewiring",
          category: "Wiring",
          isBeforeAfter: false,
          tag: "Completed Project",
          description: "Fully concealed PVC conduit wiring with fire-retardant copper cables, smart switches, and surge protection.",
          accentColor: "#0D9488",
          icon: "⚡"
        },
        {
          id: "p1-3",
          title: "Commercial Distribution Board Upgrade",
          category: "Commercial",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Replaced 15-year-old overloaded fuse board with high-grade MCB/RCD panel for Surulere supermarket.",
          accentColor: "#2563EB",
          icon: "🔌"
        },
        {
          id: "p1-4",
          title: "Emergency Tripped Main Breaker Rescue",
          category: "Emergency Repair",
          isBeforeAfter: false,
          tag: "Emergency Job",
          description: "Diagnosed grounded subterranean conduit line within 25 minutes, preventing electrical fire outbreak.",
          accentColor: "#D97706",
          icon: "🛠️"
        }
      ],
      reviews: [
        {
          id: "r1-1",
          author: "Babajide Sanusi",
          location: "Bode Thomas, Surulere",
          date: "14 Aug 2026",
          rating: 5,
          serviceType: "5kVA Inverter Installation",
          comment: "Adebayo is a master at his craft. Arrived in 20 minutes, neatly wired my solar setup with zero exposed cables, and tested every circuit. Very courteous and transparent with pricing!",
          isVerifiedCustomer: true,
          helpfulCount: 28
        },
        {
          id: "r1-2",
          author: "Dr. Funmi Williams",
          location: "Adeniran Ogunsanya, Lagos",
          date: "02 Aug 2026",
          rating: 5,
          serviceType: "Emergency Breaker Repair",
          comment: "My clinic's main breaker tripped on a Sunday morning. Called Adebayo via Lokator and he resolved the issue before our first appointment. Highly recommended!",
          isVerifiedCustomer: true,
          helpfulCount: 19
        },
        {
          id: "r1-3",
          author: "Emeka Obi",
          location: "Yaba, Lagos",
          date: "22 Jul 2026",
          rating: 5,
          serviceType: "Full House Conduit Wiring",
          comment: "Fair pricing, no hidden additions. His team finished our 3-bedroom rewiring in 2 days. Tested all sockets with earth leakage tester.",
          isVerifiedCustomer: true,
          helpfulCount: 14
        }
      ]
    },
    {
      id: 2,
      name: "Chidinma Ikenna",
      trade: "Pro Nail Technician & Esthetician",
      category: "Nail Tech",
      slug: "nail-technician",
      city: "Lagos",
      area: "Lekki Phase 1, Lagos",
      address: "Plot 8 Admiralty Way, Lekki Phase 1, Lagos",
      distanceKm: 1.2,
      rating: 5.0,
      reviewsCount: 389,
      experienceYrs: 6,
      completedJobs: 820,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348098765432",
      avatarBg: "linear-gradient(135deg, #D4AF37, #F59E0B)",
      badgeTitle: "NIN Verified & Luxury Studio",
      responseTime: "~10 mins",
      bio: "Certified luxury nail artist and lash esthetician. Specializing in Russian dry manicure, sculpted acrylic extensions, Ombre gel designs, BIAB builder gel overlays, and bespoke home services across Lekki, Ikoyi, and Victoria Island.",
      skills: ["Sculpted Acrylic Nails", "BIAB Builder Gel", "Russian Dry Manicure", "Luxury Pedicure", "Lash Extensions", "Custom Hand-painted Nail Art"],
      startingPrice: "₦5,000 / session",
      workingHours: {
        weekday: "9:00 AM – 8:00 PM",
        saturday: "9:00 AM – 8:00 PM",
        sunday: "12:00 PM – 6:00 PM (Appointments Only)"
      },
      pricingGuide: [
        { item: "Classic Russian Gel Manicure", price: "₦7,000" },
        { item: "Full Set Acrylic Extensions + Gel Polish", price: "₦14,000 – ₦22,000" },
        { item: "BIAB Builder Gel Overlay (Natural Nails)", price: "₦12,000" },
        { item: "Luxury Spa Pedicure with Jelly Foot Soak", price: "₦10,000" },
        { item: "Hybrid / Volume Lash Extensions", price: "₦15,000 – ₦25,000" }
      ],
      portfolio: [
        {
          id: "p2-1",
          title: "French Ombre Acrylic Stiletto Set",
          category: "Acrylics",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Refill and transformation from broken nails to seamless French Ombre with gold chrome accent.",
          accentColor: "#EC4899",
          icon: "💅"
        },
        {
          id: "p2-2",
          title: "Emerald Green & Gold Leaf Nail Art",
          category: "Bespoke Art",
          isBeforeAfter: false,
          tag: "Completed Set",
          description: "Hand-painted abstract emerald swirl nail art for a bridal party in Ikoyi.",
          accentColor: "#10B981",
          icon: "✨"
        },
        {
          id: "p2-3",
          title: "Luxury Spa Pedicure & Callus Treatment",
          category: "Pedicure",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Complete foot detox, deep exfoliating scrub, cuticle cleanup, and gel toe polish.",
          accentColor: "#8B5CF6",
          icon: "🌸"
        }
      ],
      reviews: [
        {
          id: "r2-1",
          author: "Amaka Bello",
          location: "Lekki Phase 1",
          date: "15 Aug 2026",
          rating: 5,
          serviceType: "Full Set Acrylics & Gel Art",
          comment: "Chidinma is the best nail tech in Lagos! My nails lasted 5 solid weeks without a single lifting. Super hygienic studio and gentle with cuticles.",
          isVerifiedCustomer: true,
          helpfulCount: 42
        },
        {
          id: "r2-2",
          author: "Tolani Adeleke",
          location: "Victoria Island, Lagos",
          date: "08 Aug 2026",
          rating: 5,
          serviceType: "BIAB Overlay + Home Visit",
          comment: "Booked her for home service before my destination wedding. She arrived right on time with all professional sterilizers. 10/10 service!",
          isVerifiedCustomer: true,
          helpfulCount: 31
        }
      ]
    },
    {
      id: 3,
      name: "Emeka Musa",
      trade: "Rapid Response Plumber & Pipe Fitter",
      category: "Plumber",
      slug: "plumber",
      city: "Lagos",
      area: "Ikeja, Lagos",
      address: "28 Allen Avenue, Ikeja, Lagos",
      distanceKm: 2.1,
      rating: 4.8,
      reviewsCount: 98,
      experienceYrs: 10,
      completedJobs: 410,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348034567890",
      avatarBg: "linear-gradient(135deg, #2563EB, #60A5FA)",
      badgeTitle: "NIN Verified Artisan",
      responseTime: "~12 mins",
      bio: "10-year experienced plumber specializing in emergency burst pipes, automated pumping machine installation, water heater mounting, soakaway chamber unblocking, and modern bathroom fixtures.",
      skills: ["Burst Pipe Repair", "Borehole & Pumping Machines", "Water Heater Installation", "Bathroom Sanitary Fittings", "Soakaway Unblocking", "Water Pressure Booster"],
      startingPrice: "₦3,500 / job",
      workingHours: {
        weekday: "7:00 AM – 7:30 PM",
        saturday: "7:00 AM – 7:00 PM",
        sunday: "24/7 Emergency Rapid Response"
      },
      pricingGuide: [
        { item: "Emergency Pipe Leak Repair", price: "₦5,000 – ₦12,000" },
        { item: "Water Heater Installation & Connection", price: "₦12,000 – ₦20,000" },
        { item: "Pumping Machine / Pressure Pump Installation", price: "₦15,000 – ₦30,000" },
        { item: "Full Bathroom Sanitary Ware Fitting", price: "₦25,000 – ₦50,000" }
      ],
      portfolio: [
        {
          id: "p3-1",
          title: "Overhead Tank 1.5HP Booster Pump Overhaul",
          category: "Pumps",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Replaced corroded galvanized suction line with PPR piping and installed automatic water level floater.",
          accentColor: "#0284C7",
          icon: "💧"
        },
        {
          id: "p3-2",
          title: "Concealed Wall Shower Mixer Installation",
          category: "Sanitary",
          isBeforeAfter: false,
          tag: "Completed Fitting",
          description: "Precision hot & cold concealed rain-shower mixer fitting with zero tile breakage.",
          accentColor: "#3B82F6",
          icon: "🚿"
        }
      ],
      reviews: [
        {
          id: "r3-1",
          author: "Taiwo Nwachukwu",
          location: "Ikeja GRA, Lagos",
          date: "11 Aug 2026",
          rating: 5,
          serviceType: "Midnight Burst Pipe Rescue",
          comment: "Pipe burst under kitchen sink at 11pm. Emeka arrived in 15 minutes and repaired it neatly. Total lifesaver!",
          isVerifiedCustomer: true,
          helpfulCount: 22
        }
      ]
    },
    {
      id: 4,
      name: "Fatima Kawu",
      trade: "Bespoke Fashion Tailor & Designer",
      category: "Tailor",
      slug: "tailor",
      city: "Abuja",
      area: "Wuse II, Abuja",
      address: "12 Aminu Kano Crescent, Wuse II, Abuja",
      distanceKm: 1.5,
      rating: 4.8,
      reviewsCount: 176,
      experienceYrs: 7,
      completedJobs: 620,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348055667788",
      avatarBg: "linear-gradient(135deg, #9D174D, #F472B6)",
      badgeTitle: "NIN Verified Master Tailor",
      responseTime: "~20 mins",
      bio: "High-end bespoke tailor and fashion designer. Specialist in crisp Senator wears, royal Agbada, Senegalese caftans, corporate blazer suits, luxury lace wedding guest gowns, and express 24-hour alterations.",
      skills: ["Senator Attire", "Royal Agbada", "Corporate Suits", "Lace & Ankara Gowns", "Express Alterations", "Bridal Outfits"],
      startingPrice: "₦6,000 / outfit",
      workingHours: {
        weekday: "8:30 AM – 7:00 PM",
        saturday: "9:00 AM – 6:00 PM",
        sunday: "Closed"
      },
      pricingGuide: [
        { item: "Standard 2-Piece Senator Attire", price: "₦12,000 – ₦25,000" },
        { item: "Royal 3-Piece Agbada with Embroidery", price: "₦35,000 – ₦80,000" },
        { item: "Female Corset Evening / Lace Gown", price: "₦25,000 – ₦65,000" },
        { item: "Express Fitting & Alterations", price: "₦3,000 – ₦8,000" }
      ],
      portfolio: [
        {
          id: "p4-1",
          title: "Navy Blue Royal Agbada with Hand Embroidery",
          category: "Native Wear",
          isBeforeAfter: false,
          tag: "Completed Garment",
          description: "Stitched with premium Irish wool cashmere fabric, featuring modern geometric thread embroidery.",
          accentColor: "#9333EA",
          icon: "🧵"
        },
        {
          id: "p4-2",
          title: "Bespoke Structured 2-Piece Linen Suit",
          category: "Suits",
          isBeforeAfter: false,
          tag: "Custom Tailoring",
          description: "Tailored for a corporate executive in Abuja with hand-finished lapels and horn buttons.",
          accentColor: "#059669",
          icon: "👔"
        }
      ],
      reviews: [
        {
          id: "r4-1",
          author: "Col. Usman Garba",
          location: "Maitama, Abuja",
          date: "06 Aug 2026",
          rating: 5,
          serviceType: "3-Piece Agbada",
          comment: "Fatima delivered my Agbada for Sallah on time. The fit was sharp, lining was premium, and the embroidery was impeccable.",
          isVerifiedCustomer: true,
          helpfulCount: 18
        }
      ]
    },
    {
      id: 5,
      name: "Kayode Alabi",
      trade: "Celebrity Barber & Hair Stylist",
      category: "Barber",
      slug: "barber",
      city: "Lagos",
      area: "Yaba, Lagos",
      address: "52 Commercial Avenue, Yaba, Lagos",
      distanceKm: 2.4,
      rating: 4.9,
      reviewsCount: 142,
      experienceYrs: 5,
      completedJobs: 980,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348123456789",
      avatarBg: "linear-gradient(135deg, #7C3AED, #A78BFA)",
      badgeTitle: "NIN Verified Stylist",
      responseTime: "~10 mins",
      bio: "Precision hair artist and grooming expert. Clean skin fades, beard sculpting, organic hot-towel treatments, dye enhancements, and mobile VIP house calls.",
      skills: ["Skin Fade", "Beard Sculpting", "Hair Dye & Enhancements", "Hot Towel Treatment", "VIP Home Service"],
      startingPrice: "₦2,500 / cut",
      workingHours: {
        weekday: "8:00 AM – 9:00 PM",
        saturday: "8:00 AM – 9:00 PM",
        sunday: "10:00 AM – 7:00 PM"
      },
      pricingGuide: [
        { item: "Standard Haircut + Clean Shave", price: "₦3,000" },
        { item: "Skin Fade + Beard Sculpting + Hot Towel", price: "₦5,500" },
        { item: "Black / Blonde Dye Enhancement", price: "₦4,000" },
        { item: "VIP Mobile Home Visit (Island / Mainland)", price: "₦15,000 – ₦25,000" }
      ],
      portfolio: [
        {
          id: "p5-1",
          title: "Low Drop Fade with Razor Sharp Lineup",
          category: "Fades",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Clean transition from bulk to skin with sharp C-cup temple definition.",
          accentColor: "#6D28D9",
          icon: "✂️"
        }
      ],
      reviews: [
        {
          id: "r5-1",
          author: "David Adele",
          location: "Akoka, Yaba",
          date: "12 Aug 2026",
          rating: 5,
          serviceType: "Skin Fade & Beard Care",
          comment: "Best fade on the Mainland. Kayode is gentle with clippers and sterilizes every tool in front of you.",
          isVerifiedCustomer: true,
          helpfulCount: 9
        }
      ]
    },
    {
      id: 6,
      name: "Ibrahim Danladi",
      trade: "Auto Mechanic & Diagnostic Tech",
      category: "Mechanic",
      slug: "mechanic",
      city: "Kano",
      area: "Nassarawa, Kano",
      address: "Plot 19 Zoo Road, Nassarawa, Kano",
      distanceKm: 3.2,
      rating: 4.7,
      reviewsCount: 115,
      experienceYrs: 12,
      completedJobs: 510,
      isVerified: true,
      isAvailable: false,
      isTop: false,
      phone: "+2348066554433",
      avatarBg: "linear-gradient(135deg, #DC2626, #F87171)",
      badgeTitle: "NIN Verified Auto Specialist",
      responseTime: "~25 mins",
      bio: "12 years specialized experience in Japanese (Toyota, Honda, Lexus) and German (Mercedes, BMW, Audi) automobiles. Computer diagnostic scanning, engine top-overhauls, automatic gearbox servicing, ABS brake repair, and 24/7 roadside towing assistance.",
      skills: ["Computer OBD Diagnostics", "Engine Overhaul", "Transmission Service", "ABS & Brake System", "Roadside Rescue", "Suspension Balancing"],
      startingPrice: "₦5,000 / service",
      workingHours: {
        weekday: "8:00 AM – 6:30 PM",
        saturday: "8:00 AM – 6:00 PM",
        sunday: "Roadside Rescue Only"
      },
      pricingGuide: [
        { item: "Computer Diagnostic Scan & Error Clear", price: "₦5,000" },
        { item: "Routine Engine Service (Oil, Plugs, Filters)", price: "₦8,000 – ₦15,000" },
        { item: "Brake Pad Replacement & Disc Skimming", price: "₦7,000 – ₦14,000" },
        { item: "Complete Engine Overhaul", price: "₦60,000 – ₦150,000" }
      ],
      portfolio: [
        {
          id: "p6-1",
          title: "Lexus RX350 V6 Engine Diagnostic & Timing Chain Replacement",
          category: "Engine Overhaul",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Diagnosed misfire codes P0300 and replaced worn timing chain kit, restoring smooth horsepower.",
          accentColor: "#DC2626",
          icon: "🔩"
        }
      ],
      reviews: [
        {
          id: "r6-1",
          author: "Sani Kabiru",
          location: "Bompai, Kano",
          date: "29 Jul 2026",
          rating: 5,
          serviceType: "Gearbox Valve Body Repair",
          comment: "Ibrahim is an honest mechanic. Other workshops told me to buy new gearbox for 450k; Ibrahim fixed the solenoid valve for a fraction of that!",
          isVerifiedCustomer: true,
          helpfulCount: 35
        }
      ]
    },
    {
      id: 7,
      name: "Blessing Bassey",
      trade: "Phone & Laptop Hardware Engineer",
      category: "Phone Repair",
      slug: "phone-repair",
      city: "Port Harcourt",
      area: "GRA Phase 2, Port Harcourt",
      address: "18 Olu Obasanjo Road, Port Harcourt",
      distanceKm: 1.9,
      rating: 4.9,
      reviewsCount: 260,
      experienceYrs: 6,
      completedJobs: 730,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348187654321",
      avatarBg: "linear-gradient(135deg, #0284C7, #38BDF8)",
      badgeTitle: "NIN & Micro-Soldering Certified",
      responseTime: "~15 mins",
      bio: "Certified hardware technician for iPhone, Samsung, MacBooks, and Dell/HP laptops. Specializes in OLED screen replacement, water damage recovery, logic board micro-soldering, and instant battery swaps.",
      skills: ["OLED Screen Replacement", "Motherboard Soldering", "MacBook Charging IC", "Data Recovery", "Battery Replacement"],
      startingPrice: "₦3,000 / diagnosis",
      workingHours: {
        weekday: "8:30 AM – 6:30 PM",
        saturday: "9:00 AM – 5:30 PM",
        sunday: "Closed"
      },
      pricingGuide: [
        { item: "Screen Replacement (iPhone / Samsung)", price: "₦15,000 – ₦65,000" },
        { item: "Laptop Motherboard Chip-Level Repair", price: "₦20,000 – ₦45,000" },
        { item: "Original Battery Replacement", price: "₦10,000 – ₦25,000" },
        { item: "Water Damage Deep Ultrasonic Clean", price: "₦8,000 – ₦18,000" }
      ],
      portfolio: [
        {
          id: "p7-1",
          title: "MacBook Pro M1 Liquid Damage Motherboard Restoration",
          category: "Micro Soldering",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Ultrasonic cleaning and replaced corroded capacitor rails on power IC, retrieving 500GB client data.",
          accentColor: "#0284C7",
          icon: "💻"
        }
      ],
      reviews: [
        {
          id: "r7-1",
          author: "Tonye Briggs",
          location: "GRA Phase 2, Port Harcourt",
          date: "04 Aug 2026",
          rating: 5,
          serviceType: "iPhone 13 Screen & Battery Replacement",
          comment: "Repaired my phone in less than 40 minutes while I waited in the lounge. True Tone retained and battery health back to 100%.",
          isVerifiedCustomer: true,
          helpfulCount: 21
        }
      ]
    },
    {
      id: 8,
      name: "Sunday Ogundipe",
      trade: "Master Carpenter & Cabinet Craftsman",
      category: "Carpenter",
      slug: "carpenter",
      city: "Oyo",
      area: "Bodija, Ibadan",
      address: "15 Secretariat Road, Bodija, Ibadan",
      distanceKm: 4.0,
      rating: 4.5,
      reviewsCount: 64,
      experienceYrs: 14,
      completedJobs: 380,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348077889900",
      avatarBg: "linear-gradient(135deg, #92400E, #D97706)",
      badgeTitle: "NIN Verified Woodcraft Artisan",
      responseTime: "~20 mins",
      bio: "14 years crafting bespoke modular kitchen cabinets, floor-to-ceiling master wardrobes, solid hardwood security doors, roof trusses, and modern minimalist office furniture from termite-treated Nigerian hardwood and HDF boards.",
      skills: ["Modular Kitchen Cabinets", "Master Wardrobes", "Hardwood Doors", "Roof Trusses & Ceilings", "Office Desks", "Furniture Restoration"],
      startingPrice: "₦15,000 / project",
      workingHours: {
        weekday: "7:30 AM – 6:30 PM",
        saturday: "8:00 AM – 6:00 PM",
        sunday: "Closed"
      },
      pricingGuide: [
        { item: "Modular Kitchen Cabinet Set (Per Linear Metre)", price: "₦45,000 – ₦85,000" },
        { item: "Built-in 4-Door Wardrobe with Mirrors", price: "₦120,000 – ₦250,000" },
        { item: "Solid Hardwood Flush Door Installation", price: "₦25,000 – ₦55,000" },
        { item: "Custom Executive Work Desk", price: "₦65,000 – ₦130,000" }
      ],
      portfolio: [
        {
          id: "p8-1",
          title: "Modern Acrylic High-Gloss Kitchen Cabinetry",
          category: "Kitchens",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Custom grey & white soft-close cabinets with concealed LED under-lighting in Ibadan duplex.",
          accentColor: "#D97706",
          icon: "🪚"
        }
      ],
      reviews: [
        {
          id: "r8-1",
          author: "Mrs. Yewande Adeleke",
          location: "Bodija, Ibadan",
          date: "18 Jul 2026",
          rating: 5,
          serviceType: "Kitchen Cabinets Installation",
          comment: "Sunday built our kitchen cabinets with solid materials. Delivered ahead of schedule with great attention to detail.",
          isVerifiedCustomer: true,
          helpfulCount: 16
        }
      ]
    },
    {
      id: 9,
      name: "Zainab Bello",
      trade: "Event Caterer & Luxury Baker",
      category: "Caterer",
      slug: "caterer",
      city: "Abuja",
      area: "Maitama, Abuja",
      address: "44 Gana Street, Maitama, Abuja",
      distanceKm: 3.8,
      rating: 4.9,
      reviewsCount: 310,
      experienceYrs: 9,
      completedJobs: 890,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348099887766",
      avatarBg: "linear-gradient(135deg, #D97706, #FBBF24)",
      badgeTitle: "NIN Verified Caterer & NAFDAC Compliant",
      responseTime: "~15 mins",
      bio: "Gourmet caterer for luxury weddings, corporate summits, and private dinners. Specialist in authentic Nigerian party jollof, small chops finger foods, barbecue grilled fish/chicken, and custom multi-tier wedding cakes.",
      skills: ["Party Jollof & Fried Rice", "Gourmet Small Chops", "Custom Tiered Cakes", "Live Barbecue Grilling", "Corporate Buffet"],
      startingPrice: "₦10,000 / pack",
      workingHours: {
        weekday: "8:00 AM – 7:00 PM",
        saturday: "7:00 AM – 8:00 PM",
        sunday: "Event Bookings Only"
      },
      pricingGuide: [
        { item: "Small Chops Platter (100 pieces)", price: "₦18,000 – ₦30,000" },
        { item: "Party Buffet Catering (Per Head)", price: "₦4,500 – ₦12,000" },
        { item: "Custom 3-Tier Fondant Birthday Cake", price: "₦35,000 – ₦85,000" }
      ],
      portfolio: [
        {
          id: "p9-1",
          title: "500-Guest Corporate Gala Dinner Buffet",
          category: "Catering",
          isBeforeAfter: false,
          tag: "Event Catering",
          description: "Full service catering featuring smoky jollof, grilled croaker fish, and continental salad bar.",
          accentColor: "#F59E0B",
          icon: "🍽️"
        }
      ],
      reviews: [
        {
          id: "r9-1",
          author: "Halima Danjuma",
          location: "Maitama, Abuja",
          date: "01 Aug 2026",
          rating: 5,
          serviceType: "Wedding Catering Buffet",
          comment: "Zainab's smoky jollof rice was the talk of our wedding! Clean presentation and punctual team.",
          isVerifiedCustomer: true,
          helpfulCount: 26
        }
      ]
    },
    {
      id: 10,
      name: "Tunde Williams",
      trade: "Express Dispatch Rider & Logistics Courier",
      category: "Dispatch",
      slug: "dispatch",
      city: "Lagos",
      area: "Victoria Island, Lagos",
      address: "10 Akin Adesola, Victoria Island, Lagos",
      distanceKm: 0.6,
      rating: 4.8,
      reviewsCount: 420,
      experienceYrs: 4,
      completedJobs: 1200,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348144332211",
      avatarBg: "linear-gradient(135deg, #059669, #34D399)",
      badgeTitle: "NIN Verified & Insured Box",
      responseTime: "~8 mins",
      bio: "Same-day express courier dispatch covering Island and Mainland Lagos. Fully insured weatherproof carrier box, live WhatsApp real-time location sharing, and careful handling for food, fragile gifts, documents, and corporate deliveries.",
      skills: ["Same-Day Delivery", "Document Courier", "E-Commerce Dispatch", "Food & Cake Handling", "Island to Mainland Express"],
      startingPrice: "₦1,500 / drop",
      workingHours: {
        weekday: "7:00 AM – 8:00 PM",
        saturday: "8:00 AM – 7:00 PM",
        sunday: "9:00 AM – 5:00 PM"
      },
      pricingGuide: [
        { item: "Intra-Island Delivery (VI, Lekki, Ikoyi)", price: "₦1,500 – ₦2,500" },
        { item: "Island to Mainland Express Delivery", price: "₦3,000 – ₦5,000" },
        { item: "Same-Day Round Trip Document Pickup", price: "₦4,000" }
      ],
      portfolio: [
        {
          id: "p10-1",
          title: "Fragile Multi-tier Cake Delivery Across Third Mainland Bridge",
          category: "Logistics",
          isBeforeAfter: false,
          tag: "Safe Delivery",
          description: "Delivered 4-tier wedding cake in shock-absorbent cooler box with zero tilt.",
          accentColor: "#10B981",
          icon: "🏍️"
        }
      ],
      reviews: [
        {
          id: "r10-1",
          author: "Femi Shonibare",
          location: "Oniru, VI",
          date: "14 Aug 2026",
          rating: 5,
          serviceType: "Urgent Document Dispatch",
          comment: "Picked up legal deed in VI and delivered to Ikeja High Court in 35 minutes. Constant GPS updates!",
          isVerifiedCustomer: true,
          helpfulCount: 15
        }
      ]
    },
    {
      id: 11,
      name: "Ngozi Eze",
      trade: "Professional Painter & Wall Artist",
      category: "Painter",
      slug: "painter",
      city: "Enugu",
      area: "Independence Layout, Enugu",
      address: "24 Presidential Road, Enugu",
      distanceKm: 2.8,
      rating: 4.7,
      reviewsCount: 88,
      experienceYrs: 8,
      completedJobs: 310,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348022334455",
      avatarBg: "linear-gradient(135deg, #059669, #10B981)",
      badgeTitle: "NIN Verified Wall Specialist",
      responseTime: "~20 mins",
      bio: "Expert residential and commercial interior/exterior painting, dustless wall screeding, stucco marble effect, washable satin coatings, and 3D geometric wall panel installations.",
      skills: ["Dustless Wall Screeding", "Stucco & Marble Effect", "Interior & Exterior Painting", "3D Wall Panels", "Anti-Fungal Coatings"],
      startingPrice: "₦5,000 / room",
      workingHours: {
        weekday: "8:00 AM – 6:00 PM",
        saturday: "8:00 AM – 5:00 PM",
        sunday: "Closed"
      },
      pricingGuide: [
        { item: "Room Painting (Labor Only)", price: "₦5,000 – ₦10,000" },
        { item: "Full House Dustless Screeding & Painting", price: "₦80,000 – ₦220,000" },
        { item: "Italian Stucco / Marble Wall Finish", price: "₦25,000 – ₦60,000 / wall" }
      ],
      portfolio: [
        {
          id: "p11-1",
          title: "Luxury Duplex Wall Screeding & Satin Paint",
          category: "Interior Finish",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Smoothed cracked cement walls into flawless silk-smooth finish in Enugu residence.",
          accentColor: "#059669",
          icon: "🎨"
        }
      ],
      reviews: [
        {
          id: "r11-1",
          author: "Chuka Nwosu",
          location: "Independence Layout, Enugu",
          date: "26 Jul 2026",
          rating: 5,
          serviceType: "Full Duplex Screeding & Painting",
          comment: "Ngozi's screeding is as smooth as glass. Masked all our floors with plastic sheets so cleanup was effortless.",
          isVerifiedCustomer: true,
          helpfulCount: 12
        }
      ]
    },
    {
      id: 12,
      name: "Osasere Igbinovia",
      trade: "Master Welder & Security Fabricator",
      category: "Welder",
      slug: "welder",
      city: "Edo",
      area: "GRA, Benin City",
      address: "8 Boundary Road, GRA, Benin City",
      distanceKm: 3.5,
      rating: 4.6,
      reviewsCount: 52,
      experienceYrs: 11,
      completedJobs: 290,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348033221100",
      avatarBg: "linear-gradient(135deg, #B45309, #F59E0B)",
      badgeTitle: "NIN Verified Fabricator",
      responseTime: "~20 mins",
      bio: "Heavy-duty electric arc and argon gas welding. Specialist in motorized iron security gates, wrought-iron burglar proofing, heavy overhead water tank stands, and stainless steel balcony railings.",
      skills: ["Automated Security Gates", "Burglar Proofing", "Water Tank Stands", "Stainless Steel Railings", "Structural Steel Trusses"],
      startingPrice: "₦12,000 / gate",
      workingHours: {
        weekday: "7:30 AM – 6:30 PM",
        saturday: "8:00 AM – 5:30 PM",
        sunday: "Emergency Welding Only"
      },
      pricingGuide: [
        { item: "Burglar Proof Window Grilles (Per Window)", price: "₦12,000 – ₦25,000" },
        { item: "Standard Dual-Leaf Iron Security Gate", price: "₦150,000 – ₦350,000" },
        { item: "Heavy Duty 2-Tank Steel Stanchion Stand", price: "₦85,000 – ₦180,000" }
      ],
      portfolio: [
        {
          id: "p12-1",
          title: "Automated Laser-Cut Security Gate with Rust-Proof Primer",
          category: "Fabrication",
          isBeforeAfter: false,
          tag: "Custom Gate",
          description: "Built with 2mm galvanized steel and coated in weather-resistant polyurethane enamel in Benin City.",
          accentColor: "#D97706",
          icon: "🔥"
        }
      ],
      reviews: [
        {
          id: "r12-1",
          author: "Osaro Egharevba",
          location: "GRA, Benin City",
          date: "19 Jul 2026",
          rating: 5,
          serviceType: "Security Gate & Tank Stand",
          comment: "Solid welding. The tank stand was sturdy and reinforced with heavy iron angle bars. Delivered on time.",
          isVerifiedCustomer: true,
          helpfulCount: 8
        }
      ]
    },
    {
      id: 13,
      name: "Grace Alabi",
      trade: "Professional Deep Cleaner & Housekeeper",
      category: "Cleaning",
      slug: "cleaner",
      city: "Lagos",
      area: "Victoria Island, Lagos",
      address: "16 Adeola Odeku, Victoria Island, Lagos",
      distanceKm: 0.9,
      rating: 4.9,
      reviewsCount: 164,
      experienceYrs: 5,
      completedJobs: 640,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348031122334",
      avatarBg: "linear-gradient(135deg, #0D9488, #2DD4BF)",
      badgeTitle: "NIN Verified & Insured Cleaners",
      responseTime: "~15 mins",
      bio: "Certified commercial and residential deep cleaning specialist. Sparkling post-construction cleanup, routine apartment housekeeping, fumigation & pest eradication, sofa/mattress steam extraction, and sanitization.",
      skills: ["Post-Construction Cleanup", "Residential Deep Cleaning", "Fumigation & Pest Control", "Upholstery & Mattress Steam Wash", "Office Janitorial"],
      startingPrice: "₦8,000 / session",
      workingHours: {
        weekday: "7:00 AM – 7:00 PM",
        saturday: "7:00 AM – 6:00 PM",
        sunday: "8:00 AM – 4:00 PM"
      },
      pricingGuide: [
        { item: "Standard 2-Bedroom Apartment Deep Clean", price: "₦25,000 – ₦45,000" },
        { item: "Post-Construction Chemical Tile & Window Cleaning", price: "₦50,000 – ₦120,000" },
        { item: "7-Seater Sofa / Sectional Steam Extraction", price: "₦18,000 – ₦30,000" },
        { item: "Full House Odorless Fumigation & Pest Control", price: "₦25,000 – ₦55,000" }
      ],
      portfolio: [
        {
          id: "p13-1",
          title: "Post-Construction Paint & Cement Stain Removal",
          category: "Deep Cleaning",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Removed stubborn cement grout and paint drops from luxury porcelain tiles in VI penthouse.",
          accentColor: "#0D9488",
          icon: "✨"
        },
        {
          id: "p13-2",
          title: "Fabric Sectional Sofa Deep Steam Extraction",
          category: "Upholstery",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Extracted deep coffee and pet stains from beige velvet sectional, drying in under 2 hours.",
          accentColor: "#0284C7",
          icon: "🛋️"
        }
      ],
      reviews: [
        {
          id: "r13-1",
          author: "Oluwaseun Bakare",
          location: "Victoria Island, Lagos",
          date: "16 Aug 2026",
          rating: 5,
          serviceType: "Post-Construction Deep Clean",
          comment: "Grace and her team transformed our newly renovated apartment in 6 hours. Every tile, window sill, and bathroom glass was spotless.",
          isVerifiedCustomer: true,
          helpfulCount: 33
        },
        {
          id: "r13-2",
          author: "Nkiru Okonjo",
          location: "Oniru, Lagos",
          date: "09 Aug 2026",
          rating: 5,
          serviceType: "Fumigation & Sofa Cleaning",
          comment: "Odorless fumigation was safe for our kids and pets. Sofa looks brand new. Very respectful staff.",
          isVerifiedCustomer: true,
          helpfulCount: 24
        }
      ]
    },
    {
      id: 14,
      name: "David 'SoundWave' Okon",
      trade: "Recording Studio, Music Producer & Audio Engineer",
      category: "Recording Studio",
      slug: "recording-studio",
      city: "Warri",
      state: "Delta",
      area: "Airport Road, Warri, Delta",
      address: "12 Airport Road, Effurun, Warri, Delta State",
      distanceKm: 1.4,
      rating: 5.0,
      reviewsCount: 142,
      experienceYrs: 7,
      completedJobs: 320,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348055667788",
      avatarBg: "linear-gradient(135deg, #7C3AED, #4F46E5)",
      badgeTitle: "NIN Verified Sound Studio",
      responseTime: "~8 mins",
      bio: "Premier acoustic music recording studio and audio production facility. Specializing in crisp vocal recording, multi-track mixing, analog mastering, beat production, podcast recording, and sound engineering for artists and corporate media.",
      skills: ["Recording Studio", "Music Production", "Mixing", "Mastering", "Vocal Recording", "Audio Engineer", "Sound Engineering", "Beat Making", "Podcast Studio", "Music Recording"],
      startingPrice: "₦15,000 / song session",
      workingHours: {
        weekday: "9:00 AM – 10:00 PM",
        saturday: "10:00 AM – 11:00 PM",
        sunday: "12:00 PM – 9:00 PM"
      },
      pricingGuide: [
        { item: "Single Vocal Recording Session (3 Hours)", price: "₦15,000 – ₦25,000" },
        { item: "Complete Track Mixing & Stem Balance", price: "₦25,000 – ₦50,000" },
        { item: "Industry Standard Audio Mastering (Streaming & Radio Ready)", price: "₦15,000 – ₦30,000" },
        { item: "Custom Afrobeats / Hip-Hop Beat Production", price: "₦40,000 – ₦100,000" },
        { item: "Podcast Recording & Audio Cleanup (Per Hour)", price: "₦12,000" }
      ],
      portfolio: [
        {
          id: "p14-1",
          title: "Full Studio Album Recording & Mix",
          category: "Album Production",
          isBeforeAfter: false,
          tag: "Completed Project",
          description: "Recorded and engineered a 10-track Afrobeats studio album with live brass, guitars, and crisp vocal stems.",
          accentColor: "#7C3AED",
          icon: "🎙️"
        },
        {
          id: "p14-2",
          title: "Acoustic Vocal Booth Optimization",
          category: "Studio Tech",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Installed multi-diffuser acoustic panels and Neumann U87 microphone chain for zero noise floor.",
          accentColor: "#4F46E5",
          icon: "🎧"
        }
      ],
      reviews: [
        {
          id: "r14-1",
          author: "Kelvin 'K-Vibe' Ayomide",
          location: "Effurun, Warri",
          date: "12 Aug 2026",
          rating: 5,
          serviceType: "Vocal Recording & Mixing",
          comment: "Best recording studio in Warri hands down! SoundWave's ear for mixing is world-class. My song sounds radio-ready and balanced on every speaker.",
          isVerifiedCustomer: true,
          helpfulCount: 38
        },
        {
          id: "r14-2",
          author: "Blessing Igbinovia",
          location: "Warri, Delta",
          date: "04 Aug 2026",
          rating: 5,
          serviceType: "Podcast Sound Engineering",
          comment: "Clean vocals, no background noise or distortion. Super comfortable air-conditioned studio with top equipment.",
          isVerifiedCustomer: true,
          helpfulCount: 22
        }
      ]
    },
    {
      id: 15,
      name: "Michael Efe",
      trade: "Pro Photographer & Cinematographer",
      category: "Photography",
      slug: "photographer",
      city: "Ughelli",
      state: "Delta",
      area: "Otovwodo, Ughelli, Delta",
      address: "18 Market Road, Otovwodo, Ughelli, Delta State",
      distanceKm: 0.9,
      rating: 4.9,
      reviewsCount: 118,
      experienceYrs: 6,
      completedJobs: 290,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348033445566",
      avatarBg: "linear-gradient(135deg, #0284C7, #0369A1)",
      badgeTitle: "NIN Verified Creative",
      responseTime: "~10 mins",
      bio: "Creative wedding, event, and portrait photographer based in Ughelli, serving Delta and nationwide. Specializing in high-fashion studio portraits, traditional wedding documentaries, 4K video editing, and drone aerial coverage.",
      skills: ["Photographer", "Photography", "Wedding Photography", "Event Photography", "Videographer", "Videography", "Video Editing", "Drone Pilot", "Portrait Sessions", "Photo Studio"],
      startingPrice: "₦20,000 / photo session",
      workingHours: {
        weekday: "8:00 AM – 7:00 PM",
        saturday: "8:00 AM – 8:00 PM",
        sunday: "1:00 PM – 7:00 PM (Event Bookings Only)"
      },
      pricingGuide: [
        { item: "Indoor Studio Portrait Session (10 Retouched Photos)", price: "₦20,000 – ₦35,000" },
        { item: "Traditional Wedding Full Photo & 4K Video Coverage", price: "₦150,000 – ₦350,000" },
        { item: "Birthday / Private Event Photo Coverage (3 Hours)", price: "₦45,000 – ₦80,000" },
        { item: "Commercial Product & Brand Photography", price: "₦50,000 – ₦120,000" }
      ],
      portfolio: [
        {
          id: "p15-1",
          title: "Delta Royal Traditional Wedding Ceremony",
          category: "Wedding",
          isBeforeAfter: false,
          tag: "Completed Project",
          description: "Comprehensive 4K cinematic photo and video documentary capturing rich Urhobo cultural wedding attire.",
          accentColor: "#0284C7",
          icon: "📸"
        }
      ],
      reviews: [
        {
          id: "r15-1",
          author: "Oghenero Dafetite",
          location: "Ughelli, Delta",
          date: "14 Aug 2026",
          rating: 5,
          serviceType: "Wedding Photography",
          comment: "Mike Visuals captured our wedding flawlessly in Ughelli. Photos were delivered within 5 days, crystal clear and beautifully color-graded!",
          isVerifiedCustomer: true,
          helpfulCount: 29
        }
      ]
    },
    {
      id: 16,
      name: "Emma Nduka",
      trade: "Pro Makeup Artist & Gele Stylist",
      category: "Makeup Artist",
      slug: "makeup-artist",
      city: "Port Harcourt",
      state: "Rivers",
      area: "GRA Phase 2, Port Harcourt, Rivers",
      address: "22 Tombia Street, GRA Phase 2, Port Harcourt",
      distanceKm: 1.1,
      rating: 5.0,
      reviewsCount: 265,
      experienceYrs: 8,
      completedJobs: 640,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348077889900",
      avatarBg: "linear-gradient(135deg, #EC4899, #DB2777)",
      badgeTitle: "NIN Verified Pro Artist",
      responseTime: "~15 mins",
      bio: "Celebrity and bridal makeup artist in Port Harcourt. Renowned for long-lasting skin finishes, flawless HD contouring, avant-garde Gele styling, bridal beauty consultation, and luxury home service.",
      skills: ["Makeup Artist", "Bridal Makeup", "Gele Styling", "Beauty Consultation", "Glam Makeover", "Skin Prep", "Editorial Makeup", "Nail Technician", "Hairstylist"],
      startingPrice: "₦10,000 / glam session",
      workingHours: {
        weekday: "7:00 AM – 8:00 PM",
        saturday: "6:00 AM – 9:00 PM (Bridal Rush)",
        sunday: "8:00 AM – 6:00 PM (Appointments Only)"
      },
      pricingGuide: [
        { item: "Classic Soft Glam & Lashes", price: "₦12,000 – ₦18,000" },
        { item: "Luxury Bridal Makeup (White Wedding & Traditional)", price: "₦65,000 – ₦150,000" },
        { item: "Infinity Gele / Auto-Gele Styling", price: "₦5,000 – ₦10,000" },
        { item: "Bridal Train Makeup (Per Person)", price: "₦15,000" }
      ],
      portfolio: [
        {
          id: "p16-1",
          title: "Rivers Royal Bridal Glam & Coral Crown",
          category: "Bridal",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Full bridal skin prep and glam makeover for a high-profile Port Harcourt traditional wedding.",
          accentColor: "#EC4899",
          icon: "💄"
        }
      ],
      reviews: [
        {
          id: "r16-1",
          author: "Tonye Briggs",
          location: "GRA Phase 2, Port Harcourt",
          date: "11 Aug 2026",
          rating: 5,
          serviceType: "Bridal Makeup & Gele",
          comment: "Emma made me look and feel like royalty on my wedding day! My makeup stayed intact from 8 AM until midnight with zero creasing.",
          isVerifiedCustomer: true,
          helpfulCount: 45
        }
      ]
    },
    {
      id: 17,
      name: "Engr. Yusuf Aliyu",
      trade: "Solar & Inverter Engineer, AC Technician",
      category: "Solar & Renewable Energy",
      slug: "solar-installer",
      city: "Abuja",
      state: "Abuja",
      area: "Wuse 2, Abuja",
      address: "Plot 42 Aminu Kano Crescent, Wuse 2, Abuja",
      distanceKm: 1.8,
      rating: 4.9,
      reviewsCount: 184,
      experienceYrs: 9,
      completedJobs: 480,
      isVerified: true,
      isAvailable: true,
      isTop: true,
      phone: "+2348066778899",
      avatarBg: "linear-gradient(135deg, #10B981, #047857)",
      badgeTitle: "COREN & NEMSA Certified",
      responseTime: "~15 mins",
      bio: "Certified renewable energy engineer and heating/cooling technician. Expert in high-efficiency monocrystalline solar installations, hybrid inverter configurations, lithium battery maintenance, AC repair, and industrial power management.",
      skills: ["Solar Installer", "Solar Installation", "Inverter Repair", "Lithium Battery Setup", "AC Technician", "AC Repair", "HVAC", "Electrical Wiring", "Energy Audit", "Generator Changeover"],
      startingPrice: "₦8,000 / inspection",
      workingHours: {
        weekday: "7:30 AM – 7:00 PM",
        saturday: "8:00 AM – 6:00 PM",
        sunday: "Emergency Callouts (24/7)"
      },
      pricingGuide: [
        { item: "Solar & Inverter Diagnostic Inspection", price: "₦8,000" },
        { item: "5kVA–10kVA Solar Panel Mounting & Wiring", price: "₦45,000 – ₦90,000" },
        { item: "Split AC Servicing, Chemical Wash & Gas Refill", price: "₦12,000 – ₦25,000" },
        { item: "AC Inverter Board Repair & Compressor Fixing", price: "₦18,000 – ₦45,000" }
      ],
      portfolio: [
        {
          id: "p17-1",
          title: "10kVA Commercial Solar Rooftop Installation",
          category: "Commercial Solar",
          isBeforeAfter: false,
          tag: "Completed Project",
          description: "Installed 16 Tier-1 solar panels and 15kWh lithium battery storage for a Wuse 2 corporate clinic.",
          accentColor: "#10B981",
          icon: "☀️"
        }
      ],
      reviews: [
        {
          id: "r17-1",
          author: "Barr. Ibrahim Bello",
          location: "Maitama, Abuja",
          date: "07 Aug 2026",
          rating: 5,
          serviceType: "10kVA Solar & AC Service",
          comment: "Engr. Yusuf is extraordinarily skilled. Solved an inverter synchronization fault that two other technicians couldn't fix. Very honest and professional.",
          isVerifiedCustomer: true,
          helpfulCount: 31
        }
      ]
    },
    {
      id: 18,
      name: "Tobi Daniels",
      trade: "UI/UX Designer, Graphic Designer & Brand Strategist",
      category: "Digital & Design",
      slug: "graphic-designer",
      city: "Lagos",
      state: "Lagos",
      area: "Yaba, Lagos",
      address: "10 Herbert Macaulay Way, Yaba, Lagos",
      distanceKm: 1.0,
      rating: 5.0,
      reviewsCount: 96,
      experienceYrs: 5,
      completedJobs: 210,
      isVerified: true,
      isAvailable: true,
      isTop: false,
      phone: "+2348099887766",
      avatarBg: "linear-gradient(135deg, #F59E0B, #D97706)",
      badgeTitle: "NIN Verified Digital Pro",
      responseTime: "~10 mins",
      bio: "Product designer and brand identity specialist based in Yaba. Creating stunning mobile app interfaces, web UI/UX, corporate brand guidelines, marketing flyers, logo suites, and digital illustrations for Nigerian and global businesses.",
      skills: ["UI/UX Designer", "Graphic Designer", "Product Designer", "Logo Design", "Brand Identity", "Web Developer", "Flyer Design", "Motion Graphics", "Tutor"],
      startingPrice: "₦15,000 / design project",
      workingHours: {
        weekday: "9:00 AM – 7:00 PM",
        saturday: "10:00 AM – 5:00 PM",
        sunday: "Closed"
      },
      pricingGuide: [
        { item: "Brand Logo Suite + Visual Style Guide", price: "₦35,000 – ₦80,000" },
        { item: "Marketing Flyer / Social Media Campaign Pack", price: "₦15,000 – ₦30,000" },
        { item: "Mobile App / Web UI Design in Figma (Per Screen)", price: "₦12,000 – ₦25,000" }
      ],
      portfolio: [
        {
          id: "p18-1",
          title: "Fintech App UI/UX Redesign & Design System",
          category: "UI/UX",
          isBeforeAfter: true,
          tag: "Before & After",
          description: "Revamped user onboarding and wallet flows, increasing mobile checkout conversion by 34%.",
          accentColor: "#F59E0B",
          icon: "🎨"
        }
      ],
      reviews: [
        {
          id: "r18-1",
          author: "Chukwudi Okoli",
          location: "Lekki, Lagos",
          date: "10 Aug 2026",
          rating: 5,
          serviceType: "Logo & Brand Identity",
          comment: "Tobi delivered beyond expectations. Clean, modern typography and brand assets ready for print and web. Fast turnaround.",
          isVerifiedCustomer: true,
          helpfulCount: 18
        }
      ]
    }
  ];

  // Provider Data Manager
  const ProviderStore = {
    getAll() {
      return DEFAULT_PROVIDERS_DATA;
    },

    getById(id) {
      const numId = Number(id);
      const provider = DEFAULT_PROVIDERS_DATA.find(p => p.id === numId);
      if (!provider) return null;

      // Merge reviews from localStorage if any exist
      const reviews = this.getReviews(numId);
      return {
        ...provider,
        reviews: reviews,
        reviewsCount: reviews.length,
        rating: this.calculateAverageRating(reviews)
      };
    },

    getReviews(providerId) {
      const numId = Number(providerId);
      const defaultProvider = DEFAULT_PROVIDERS_DATA.find(p => p.id === numId);
      const baseReviews = defaultProvider && defaultProvider.reviews ? [...defaultProvider.reviews] : [];

      try {
        const stored = localStorage.getItem(`lokator_reviews_${numId}`);
        if (stored) {
          const customReviews = JSON.parse(stored);
          if (Array.isArray(customReviews)) {
            // Newest custom reviews on top
            return [...customReviews, ...baseReviews];
          }
        }
      } catch (e) {
        console.warn('LocalStorage unavailable for review store', e);
      }
      return baseReviews;
    },

    addReview(providerId, reviewData) {
      const numId = Number(providerId);
      const newReview = {
        id: `rev-${Date.now()}`,
        author: reviewData.author || 'Anonymous Customer',
        location: reviewData.location || 'Lagos, Nigeria',
        date: 'Today',
        rating: Number(reviewData.rating) || 5,
        serviceType: reviewData.serviceType || 'General Service',
        comment: reviewData.comment || '',
        isVerifiedCustomer: true,
        helpfulCount: 0
      };

      try {
        const stored = localStorage.getItem(`lokator_reviews_${numId}`);
        const customReviews = stored ? JSON.parse(stored) : [];
        customReviews.unshift(newReview);
        localStorage.setItem(`lokator_reviews_${numId}`, JSON.stringify(customReviews));
      } catch (e) {
        console.warn('Could not save review to localStorage', e);
      }

      return newReview;
    },

    calculateAverageRating(reviews) {
      if (!reviews || reviews.length === 0) return 5.0;
      const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      return Number((sum / reviews.length).toFixed(1));
    },

    getNearbyProviders(currentId, limit = 3) {
      const numId = Number(currentId);
      const current = DEFAULT_PROVIDERS_DATA.find(p => p.id === numId);
      if (!current) return DEFAULT_PROVIDERS_DATA.slice(0, limit);

      // Prefer same city or category
      return DEFAULT_PROVIDERS_DATA
        .filter(p => p.id !== numId)
        .sort((a, b) => {
          const aSameCity = a.city === current.city ? 1 : 0;
          const bSameCity = b.city === current.city ? 1 : 0;
          if (aSameCity !== bSameCity) return bSameCity - aSameCity;
          return a.distanceKm - b.distanceKm;
        })
        .slice(0, limit);
    }
  };

  // Expose
  global.PROVIDERS_DATA = DEFAULT_PROVIDERS_DATA;
  global.ProviderStore = ProviderStore;

})(typeof window !== 'undefined' ? window : this);
