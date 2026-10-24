import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TripPlanResult, SavedTrip } from '../types';
import { getEmergencyContactsForCountry } from '../data/emergencyContacts';

/**
 * Formats a number into clean Indian rupee currency string without special characters that could break standard PDF fonts
 */
export function formatCurrencyINR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
}

/**
 * Generates and triggers download of a comprehensive, professional PDF travel plan for SAFARNAMA AI.
 * Includes complete itemized budget, calculation assumptions, verified vs estimated cost badges,
 * day-by-day itinerary, accommodations, and travel disclaimers.
 */
export async function exportTripPlanToPDF(planResult: TripPlanResult, customTripName?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const {
    formData,
    itinerary,
    activePlan,
    budgetPlans,
    places,
    accommodations,
    routeInfo
  } = planResult;

  const tripTitle = customTripName || `${formData.origin} to ${formData.destination}`;
  const totalBudget = formData.totalBudget;
  const totalEstimatedCost = activePlan.totalEstimatedCost;
  const costPerTraveler = activePlan.costPerPerson;
  const remainingBudget = activePlan.remainingBudget;
  const isWithinBudget = activePlan.isWithinBudget;
  const nightsCount = Math.max(1, formData.durationDays - 1);
  const roomsCount = Math.ceil(formData.travelers / 2);

  // Brand Palette (RGB format for jsPDF)
  const plumRGB: [number, number, number] = [75, 41, 79];       // #4B294F
  const charcoalRGB: [number, number, number] = [36, 33, 43];    // #24212B
  const aquaRGB: [number, number, number] = [120, 201, 208];     // #78C9D0
  const sandRGB: [number, number, number] = [216, 195, 165];     // #D8C3A5
  const ivoryRGB: [number, number, number] = [250, 247, 240];    // #FAF7F0
  const magentaRGB: [number, number, number] = [194, 24, 91];    // #C2185B
  const grayRGB: [number, number, number] = [119, 113, 127];     // #77717F

  let currentY = margin;

  // -------------------------------------------------------------
  // Header Banner: SAFARNAMA AI
  // -------------------------------------------------------------
  doc.setFillColor(...plumRGB);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');

  // Brand Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SAFARNAMA AI', margin + 6, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...aquaRGB);
  doc.text('BUDGET VACATION OPTIMIZER — OFFICIAL TRIP ITINERARY', margin + 6, currentY + 18);

  // Generation Date
  doc.setFontSize(8);
  doc.setTextColor(...sandRGB);
  const genDateStr = `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  doc.text(genDateStr, pageWidth - margin - 6, currentY + 11, { align: 'right' });

  const statusBadge = isWithinBudget ? 'WITHIN BUDGET GOAL' : 'EXCEEDS BUDGET TARGET';
  doc.text(statusBadge, pageWidth - margin - 6, currentY + 18, { align: 'right' });

  currentY += 30;

  // -------------------------------------------------------------
  // Trip Overview Box
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...charcoalRGB);
  doc.text(tripTitle, margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayRGB);

  const intlLabel = formData.country && formData.country !== 'India' ? ` [${formData.country} · ${formData.currency || 'FX'}]` : '';
  const routeSummary = `${formData.origin} -> ${formData.destination}${intlLabel}${routeInfo?.distanceKm ? ` (~${routeInfo.distanceKm} km ${formData.country && formData.country !== 'India' ? 'transit' : 'road'} route)` : ''}`;
  doc.text(routeSummary, margin, currentY);

  currentY += 6;

  // Key Metrics Table / Grid
  const overviewData = [
    [
      `Travelers: ${formData.travelers} (${formData.travelers === 1 ? 'Solo' : `${roomsCount} Room(s)`})`,
      `Duration: ${formData.durationDays} Days / ${nightsCount} Nights`,
      `Travel Dates: ${formData.departureDate || 'Flexible'}${formData.returnDate ? ` to ${formData.returnDate}` : ''}`,
      `Travel Style: ${formData.travelStyle.toUpperCase()}`
    ],
    [
      `Allocated Budget: ${formatCurrencyINR(totalBudget)}`,
      `Estimated Cost: ${formatCurrencyINR(totalEstimatedCost)}`,
      `Cost / Traveler: ${formatCurrencyINR(costPerTraveler)}`,
      `Remaining Buffer: ${isWithinBudget ? '+' : ''}${formatCurrencyINR(remainingBudget)}`
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    body: overviewData,
    styles: {
      fontSize: 8.5,
      textColor: charcoalRGB,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: contentWidth * 0.28 },
      1: { cellWidth: contentWidth * 0.24 },
      2: { cellWidth: contentWidth * 0.28 },
      3: { fontStyle: 'bold', textColor: isWithinBudget ? plumRGB : magentaRGB, cellWidth: contentWidth * 0.20 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // Section 1: Itemized Budget Breakdown with Verification Status
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...plumRGB);
  doc.text(`1. ITEMIZED BUDGET BREAKDOWN (${activePlan.title})`, margin, currentY);

  currentY += 4;

  const breakdownRows = [
    [
      'Intercity Transport',
      formatCurrencyINR(activePlan.breakdown.intercityTransport.amount),
      activePlan.breakdown.intercityTransport.label || 'Round-trip transit',
      'Estimated based on transit distance and mode',
      'Estimated Cost'
    ],
    [
      'Local City Transit',
      formatCurrencyINR(activePlan.breakdown.localTransport.amount),
      activePlan.breakdown.localTransport.label || 'Local buses, metro & autos',
      `Calculated at ${formatCurrencyINR(activePlan.breakdown.localTransport.perDay || 300)}/day for ${formData.durationDays} days`,
      'Estimated Cost'
    ],
    [
      'Lodging / Stays',
      formatCurrencyINR(activePlan.breakdown.accommodation.amount),
      activePlan.breakdown.accommodation.label || 'Hotel/Hostel',
      `${roomsCount} room(s) x ${nightsCount} night(s) at ${formatCurrencyINR(activePlan.breakdown.accommodation.ratePerNight || 1600)}/night`,
      'Estimated Cost'
    ],
    [
      'Food & Beverages',
      formatCurrencyINR(activePlan.breakdown.foodAndBeverages.amount),
      activePlan.breakdown.foodAndBeverages.label || 'Daily meals & thalis',
      `${formData.travelers} traveler(s) x ${formData.durationDays} days at ${formatCurrencyINR(activePlan.breakdown.foodAndBeverages.perPersonPerDay || 750)}/day`,
      'Estimated Cost'
    ],
    [
      'Sightseeing & Entry',
      formatCurrencyINR(activePlan.breakdown.activitiesAndFees.amount),
      activePlan.breakdown.activitiesAndFees.label || 'Monument tickets & admissions',
      'Based on verified ASI monument entry rates and typical city tickets',
      'Indicative Range'
    ],
    [
      'Water & Incidentals',
      formatCurrencyINR(activePlan.breakdown.miscellaneous.amount),
      activePlan.breakdown.miscellaneous.label || 'Bottled water, tea & incidentals',
      `Calculated at ${formatCurrencyINR(150)}/day per traveler`,
      'Estimated Cost'
    ],
    [
      'Contingency Buffer',
      formatCurrencyINR(activePlan.breakdown.emergencyContingency.amount),
      activePlan.breakdown.emergencyContingency.label || 'Emergency reserve',
      '5% to 10% reserve for delays, medical, or seasonal peak fees',
      'Contingency'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Expense Category', 'Amount', 'Allocation Details', 'Calculation Formula / Basis', 'Status']],
    body: breakdownRows,
    theme: 'striped',
    headStyles: {
      fillColor: plumRGB,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: charcoalRGB
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 26 },
      2: { cellWidth: 46 },
      3: { cellWidth: 48 },
      4: { halign: 'center', cellWidth: 27, textColor: magentaRGB, fontStyle: 'bold' }
    },
    foot: [[
      'TOTAL ESTIMATED COST',
      formatCurrencyINR(totalEstimatedCost),
      `Allocated Budget: ${formatCurrencyINR(totalBudget)}`,
      `Net Difference: ${isWithinBudget ? '+' : ''}${formatCurrencyINR(remainingBudget)} (${isWithinBudget ? 'Under Budget' : 'Over Target'})`,
      '100% Calculated'
    ]],
    footStyles: {
      fillColor: ivoryRGB,
      textColor: plumRGB,
      fontSize: 8.5,
      fontStyle: 'bold'
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // Section 2: Budget Optimization & Trade-Off Analysis
  // -------------------------------------------------------------
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...plumRGB);
  doc.text('2. BUDGET OPTIMIZATION & SAVINGS RECOMMENDATIONS', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...charcoalRGB);

  const tradeOffText = doc.splitTextToSize(`Active Tier Summary: ${activePlan.tradeOffSummary}`, contentWidth);
  doc.text(tradeOffText, margin, currentY);
  currentY += tradeOffText.length * 4 + 3;

  // Alternative Plans Summary
  const alternativeRows = [
    [
      budgetPlans.lowest.title,
      formatCurrencyINR(budgetPlans.lowest.totalEstimatedCost),
      formatCurrencyINR(budgetPlans.lowest.costPerPerson),
      budgetPlans.lowest.isWithinBudget ? `Within budget (+${formatCurrencyINR(budgetPlans.lowest.remainingBudget)})` : 'Exceeds budget',
      'Uses sleeper class / state bus, verified hostels/homestays, and regional thalis.'
    ],
    [
      budgetPlans.balanced.title,
      formatCurrencyINR(budgetPlans.balanced.totalEstimatedCost),
      formatCurrencyINR(budgetPlans.balanced.costPerPerson),
      budgetPlans.balanced.isWithinBudget ? `Within budget (+${formatCurrencyINR(budgetPlans.balanced.remainingBudget)})` : 'Exceeds budget',
      'Optimal balance: 3AC train/AC bus, private ensuite hotel room, and curated dining.'
    ],
    [
      budgetPlans.comfort.title,
      formatCurrencyINR(budgetPlans.comfort.totalEstimatedCost),
      formatCurrencyINR(budgetPlans.comfort.costPerPerson),
      budgetPlans.comfort.isWithinBudget ? `Within budget (+${formatCurrencyINR(budgetPlans.comfort.remainingBudget)})` : 'Exceeds budget',
      'Comfort priority: 2AC train/cab hire, premium resort/boutique stay, experiential dining.'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Scenario Option', 'Total Cost', 'Per Person', 'Budget Fit', 'Key Trade-Offs']],
    body: alternativeRows,
    theme: 'grid',
    headStyles: {
      fillColor: [55, 28, 58],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: charcoalRGB
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: contentWidth - 111 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // Section 3: Day-by-Day Itinerary
  // -------------------------------------------------------------
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...plumRGB);
  doc.text('3. DAY-BY-DAY ITINERARY & SIGHTSEEING SCHEDULE', margin, currentY);

  currentY += 4;

  const itineraryDays = itinerary?.days || [];
  const itineraryRows = itineraryDays.map(day => {
    const morning = `Morning: ${day.morningActivity?.name || 'Local sightseeing'}\n(${day.morningActivity?.duration || '2.5 hrs'} - Fee: ${formatCurrencyINR(day.morningActivity?.estFee || 0)})`;
    const afternoon = `Afternoon: ${day.afternoonActivity?.name || 'Cultural exploration'}\n(${day.afternoonActivity?.duration || '2 hrs'} - Fee: ${formatCurrencyINR(day.afternoonActivity?.estFee || 0)})`;
    const evening = `Evening: ${day.eveningActivity?.name || 'Sunset & leisure'}\n(${day.eveningActivity?.duration || '2 hrs'} - Fee: ${formatCurrencyINR(day.eveningActivity?.estFee || 0)})`;
    const dailyEst = day.estimatedDayCosts
      ? `Transit: ${formatCurrencyINR(day.estimatedDayCosts.estLocalTransit)}\nFood: ${formatCurrencyINR(day.estimatedDayCosts.estFood)}\nTickets: ${formatCurrencyINR(day.estimatedDayCosts.activitiesEntryFees)}`
      : 'Standard daily budget';

    return [
      `Day ${day.dayNumber}\n${day.dateString || ''}`,
      day.title,
      `${morning}\n\n${afternoon}\n\n${evening}`,
      dailyEst
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Day', 'Title / Area', 'Planned Activities & Timing', 'Estimated Daily Expense']],
    body: itineraryRows,
    theme: 'grid',
    headStyles: {
      fillColor: plumRGB,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: charcoalRGB
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 22 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: contentWidth - 92 },
      3: { cellWidth: 30, fontSize: 7 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // Section 4: Verified Accommodations in Destination
  // -------------------------------------------------------------
  if (accommodations && accommodations.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...plumRGB);
    doc.text('4. REAL ACCOMMODATION LISTINGS (OPENSTREETMAP DATA)', margin, currentY);

    currentY += 4;

    const accRows = accommodations.slice(0, 6).map(acc => [
      acc.name,
      acc.category || 'Hotel',
      acc.address || `${formData.destination}, India`,
      acc.priceDisclaimer || 'Price unavailable — contact the property'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Establishment Name', 'Category', 'Address / Location', 'Tariff Status']],
      body: accRows,
      theme: 'striped',
      headStyles: {
        fillColor: [55, 28, 58],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: charcoalRGB
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 48 },
        1: { cellWidth: 28 },
        2: { cellWidth: contentWidth - 128 },
        3: { fontStyle: 'italic', cellWidth: 52, textColor: grayRGB }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // -------------------------------------------------------------
  // Section 5: AI Travel Analysis & Optimization Strategy
  // -------------------------------------------------------------
  const aiAnalysis = planResult.aiAnalysis || itinerary?.aiAnalysis;
  if (aiAnalysis || itinerary?.aiExplanation) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...plumRGB);
    doc.text('5. AI TRAVEL ANALYSIS & BUDGET OPTIMIZATION REPORT', margin, currentY);

    currentY += 5;

    // Summary Box
    doc.setFillColor(...ivoryRGB);
    doc.setDrawColor(...sandRGB);
    doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...plumRGB);
    const engineTitle = aiAnalysis?.isAIAnalysis
      ? `GEMINI AI STRATEGIC EVALUATION (Feasibility: ${aiAnalysis.feasibility_score || 85}/100)`
      : 'DETERMINISTIC VERIFIED TRAVEL STRATEGY EVALUATION';
    doc.text(engineTitle, margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...charcoalRGB);
    const summaryText = aiAnalysis?.summary || itinerary?.aiExplanation || 'Trip structured for optimal budget efficiency.';
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 8);
    doc.text(summaryLines.slice(0, 3), margin + 4, currentY + 10);

    currentY += 26;

    // Key Suggestions Table
    const suggestions = aiAnalysis?.saving_suggestions?.length
      ? aiAnalysis.saving_suggestions
      : (itinerary?.costSavingTips || ['Book transportation tickets at least 2-3 weeks in advance for optimal savings.']);

    const improvements = aiAnalysis?.itinerary_improvements?.length
      ? aiAnalysis.itinerary_improvements
      : ['Group geographical attractions on the same day to minimize transit costs.'];

    const aiRows = [
      ...suggestions.slice(0, 3).map(s => ['Cost Reduction', s]),
      ...improvements.slice(0, 3).map(imp => ['Itinerary Tip', imp])
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Strategic Category', 'Optimization Recommendation / Action Item']],
      body: aiRows,
      theme: 'grid',
      headStyles: {
        fillColor: plumRGB,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: charcoalRGB
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38 },
        1: { cellWidth: contentWidth - 38 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // -------------------------------------------------------------
  // Section 5B: Official Emergency Contacts & Safety Checklist
  // -------------------------------------------------------------
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin;
  }

  const emergencyContacts = getEmergencyContactsForCountry(formData.country || formData.destination);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...plumRGB);
  doc.text(`6. OFFICIAL EMERGENCY NUMBERS & TRAVEL SAFETY (${emergencyContacts.country.toUpperCase()})`, margin, currentY);

  currentY += 4;

  const emergencyRows = [
    ['Universal Emergency Dispatch', emergencyContacts.generalEmergency.number, emergencyContacts.generalEmergency.notes || 'Toll-free emergency line'],
    ['Police Emergency Control', emergencyContacts.police.number, emergencyContacts.police.notes || 'National Police Control'],
    ['Ambulance / Medical Response', emergencyContacts.ambulance.number, emergencyContacts.ambulance.notes || 'Emergency Medical Services'],
    ['Fire & Rescue Services', emergencyContacts.fire.number, emergencyContacts.fire.notes || 'Fire and rescue brigade'],
    ['Tourist Assistance Helpline', emergencyContacts.touristHelpline?.number || '112 / Hotel Desk', emergencyContacts.touristHelpline?.notes || 'Visitor support line']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Emergency Agency', 'Telephone Number', 'Jurisdiction & Notes']],
    body: emergencyRows,
    theme: 'grid',
    headStyles: {
      fillColor: charcoalRGB,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: charcoalRGB
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { fontStyle: 'bold', textColor: plumRGB, cellWidth: 35 },
      2: { cellWidth: contentWidth - 80 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // -------------------------------------------------------------
  // Section 7: Transparency & Disclaimers
  // -------------------------------------------------------------
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFillColor(...ivoryRGB);
  doc.setDrawColor(...sandRGB);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...plumRGB);
  doc.text('7. IMPORTANT TRAVEL PLANNING & PRICING DISCLOSURES', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...charcoalRGB);

  const disclaimers = [
    '* Estimated vs Verified Prices: All accommodation tariffs, train/bus/flight fares, and meal charges shown are indicative planning estimates based on typical market rates. Live booking availability, seasonal surges, and dynamic tariffs must be verified directly with providers.',
    '* Mapped Lodging Operational Notice: OpenStreetMap registered accommodation listings do not guarantee that an establishment is currently operating or accepting reservations.',
    '* Route & Distance: Highway route distances and transit durations are provided via public routing engines and do not account for localized traffic delays, monsoons, or tolls.',
    '* Privacy & Storage: This itinerary plan is stored in your local browser storage. No user accounts or third-party tracking are required.'
  ];

  let discY = currentY + 11;
  disclaimers.forEach(disc => {
    const lines = doc.splitTextToSize(disc, contentWidth - 8);
    doc.text(lines, margin + 4, discY);
    discY += lines.length * 3.2;
  });

  // -------------------------------------------------------------
  // Footer: Page Numbers on every page
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRGB);
    doc.text('SAFARNAMA AI — Budget Vacation Optimizer | OpenStreetMap & AI Studio Integration', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Sanitize filename
  const cleanFilename = `Safarnama_${formData.origin}_to_${formData.destination}_${formData.durationDays}D.pdf`
    .replace(/[^a-zA-Z0-9_\-]/g, '_');

  doc.save(cleanFilename);
}

/**
 * Exports a side-by-side trip and destination comparison report to PDF.
 */
export async function exportComparisonReportToPDF(
  comparisonData: {
    origin: string;
    destinations: Array<{
      name: string;
      state: string;
      durationDays: number;
      totalBudget: number;
      totalEstimatedCost: number;
      costPerTraveler: number;
      distanceKm?: number;
      activitiesCount: number;
      topAttractions: string[];
      isWithinBudget: boolean;
      score: number;
      highlights: string[];
    }>;
    travelers: number;
    activeWeights: Record<string, number>;
  }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const plumRGB: [number, number, number] = [75, 41, 79];
  const aquaRGB: [number, number, number] = [120, 201, 208];
  const charcoalRGB: [number, number, number] = [36, 33, 43];
  const grayRGB: [number, number, number] = [119, 113, 127];

  let currentY = margin;

  // Header Banner
  doc.setFillColor(...plumRGB);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('SAFARNAMA AI — TRIP & DESTINATION COMPARISON REPORT', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...aquaRGB);
  doc.text(`Starting Point: ${comparisonData.origin} | Group Size: ${comparisonData.travelers} Traveler(s) | Generated: ${new Date().toLocaleDateString('en-IN')}`, margin + 6, currentY + 15);

  currentY += 26;

  // Table Data
  const headers = ['Comparison Metric', ...comparisonData.destinations.map(d => `${d.name} (${d.state})`)];

  const colWidth = (contentWidth - 50) / comparisonData.destinations.length;
  const colStyles: any = { 0: { fontStyle: 'bold', cellWidth: 50 } };
  comparisonData.destinations.forEach((_, idx) => {
    colStyles[idx + 1] = { cellWidth: colWidth, halign: 'center' };
  });

  const rows = [
    ['Match Score', ...comparisonData.destinations.map(d => `${d.score}/100`)],
    ['Duration / Nights', ...comparisonData.destinations.map(d => `${d.durationDays} Days / ${Math.max(1, d.durationDays - 1)} Nights`)],
    ['Total Estimated Cost', ...comparisonData.destinations.map(d => formatCurrencyINR(d.totalEstimatedCost))],
    ['Cost per Traveler', ...comparisonData.destinations.map(d => formatCurrencyINR(d.costPerTraveler))],
    ['Budget Fit', ...comparisonData.destinations.map(d => d.isWithinBudget ? 'Within Budget' : 'Exceeds Budget')],
    ['Distance from Origin', ...comparisonData.destinations.map(d => d.distanceKm ? `~${d.distanceKm} km` : 'Route unavailable')],
    ['Planned Activities', ...comparisonData.destinations.map(d => `${d.activitiesCount} sights included`)],
    ['Top Verified Sights', ...comparisonData.destinations.map(d => d.topAttractions.slice(0, 3).join(', ') || 'Attractions listed')],
    ['Notable Advantage', ...comparisonData.destinations.map(d => d.highlights.join('; ') || 'Balanced choice')]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: plumRGB,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: charcoalRGB
    },
    columnStyles: colStyles
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayRGB);
  doc.text('* Comparison calculations use deterministic formulas combining transit distance, room requirements, and indicative market expenses in India.', margin, finalY);

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...grayRGB);
    doc.text(`SAFARNAMA AI Comparison Report — Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  doc.save(`Safarnama_Trip_Comparison_${comparisonData.origin.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
