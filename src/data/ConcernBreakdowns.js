const ConcernSeverityBreakdowns = {
    acne: {
        Extreme: {
            title: "Widespread acne requiring professional care",
            description: "Multiple painful lesions across facial zones with compromised barrier, inflammation, and high scarring risk.",
            recommendations: [
                "Schedule dermatologist appointment for prescription options (oral antibiotics, hormonal therapy, or isotretinoin).",
                "Use gentle, non-comedogenic cleansing twice daily and apply topical anti-acne agents as directed.",
                "Avoid picking or extracting lesions — increases scarring and infection risk.",
                "Use lightweight, oil-free moisturizers and daily broad-spectrum SPF to prevent pigment changes."
            ]
        },
        Severe: {
            title: "Inflamed breakouts with redness and texture change",
            description: "Concentrated outbreaks with redness affecting texture and tone. OTC care may be insufficient with moderate scarring risk.",
            recommendations: [
                "Consult dermatologist for prescription topicals or systemic therapy evaluation.",
                "Use consistent regimen with topical retinoid and benzoyl peroxide or salicylic acid.",
                "Include anti-inflammatory ingredients (niacinamide, azelaic acid) and limit comedogenic cosmetics.",
                "Track products methodically and avoid switching multiple products at once."
            ]
        },
        Moderate: {
            title: "Regular breakouts with mild inflammation",
            description: "Intermittent breakouts in T-zone, jawline, or other regions. Mix of comedones and bumps with long clear periods.",
            recommendations: [
                "Use preventative nightly retinoid and spot treat active pimples with benzoyl peroxide or salicylic acid.",
                "Keep routine simple: gentle cleanser, targeted treatment, lightweight moisturizer, daily sunscreen.",
                "Add weekly chemical exfoliation (BHA) to keep pores clear; avoid over-exfoliation.",
                "Limit face touching and cleanse after heavy sweating or prolonged makeup wear."
            ]
        },
        Fine: {
            title: "Minor blemishes with mostly clear skin",
            description: "Mostly clear skin with infrequent pimples that resolve quickly. Minimal inflammation with little redness.",
            recommendations: [
                "Maintain gentle daily routine and spot-treat blemishes immediately.",
                "Use light, oil-free moisturizer and SPF for oily or combination skin.",
                "Consider low-strength retinoid few nights weekly for pore health.",
                "Avoid comedogenic makeup and maintain consistent sleep, hydration, and dietary habits."
            ]
        },
        Great: {
            title: "Clear skin with no active acne",
            description: "No visible breakouts or congestion with smooth texture and well-maintained pores. Indicates effective care.",
            recommendations: [
                "Maintain current cleansing, moisturizing, and sun protection routine.",
                "Continue periodic gentle exfoliation and occasional skin-renewing actives.",
                "Monitor lifestyle changes (stress, sleep, diet, medications) that could trigger breakouts.",
                "Make seasonal adjustments and avoid introducing many new products at once."
            ]
        }
    },
    aging: {
        Extreme: {
            title: "Aging with deep wrinkles and laxity",
            description: "Deep lines and folds with volume loss. Rough surface with visible creping. Topical care alone has limited impact.",
            recommendations: [
                "Consult dermatologist or plastic surgeon for professional options (laser resurfacing, fillers, skin tightening).",
                "Begin or intensify nightly retinoid therapy to promote collagen remodeling.",
                "Use rich, peptide- and ceramide-containing moisturizers for barrier repair.",
                "Apply strict daily broad-spectrum SPF 30+ and include morning antioxidants (vitamin C)."
            ]
        },
        Severe: {
            title: "Wrinkles, volume loss, and textural changes",
            description: "Multiple deep wrinkles and firmness loss in expressive areas. Uneven texture and early volume depletion.",
            recommendations: [
                "Introduce prescription or OTC retinoid gradually to improve collagen synthesis and texture.",
                "Use daily antioxidant serums (vitamin C) and peptide-rich moisturizers.",
                "Consider in-office procedures (microneedling with PRP, fractional lasers, energy-based tightening).",
                "Increase hydration with hyaluronic acid serums and avoid unprotected sun exposure."
            ]
        },
        Moderate: {
            title: "Fine lines and early volume/firmness changes",
            description: "Fine lines noticeable in expression zones with slight laxity. Considerable elasticity remains.",
            recommendations: [
                "Use retinoid (start lower concentration) several times weekly to reduce lines and improve texture.",
                "Include peptides and humectants (hyaluronic acid) to boost moisture and firmness.",
                "Apply morning antioxidant serum and add gentle exfoliation to encourage cell turnover.",
                "Maintain healthy lifestyle factors (sleep, nutrition, reduced alcohol)."
            ]
        },
        Fine: {
            title: "Early subtle aging signs but mostly youthful",
            description: "Small lines around expression areas with firmness and elasticity intact. Ideal stage for preventive care.",
            recommendations: [
                "Begin low-strength retinoid 1-3 times weekly to build tolerance and prevent progression.",
                "Use daily antioxidants and hydrating routine (hyaluronic acid + moisturizer).",
                "Protect with broad-spectrum SPF every morning and reapply as needed.",
                "Prioritize consistent sleep and hydration for nightly repair processes."
            ]
        },
        Great: {
            title: "Youthful skin with excellent tone and minimal lines",
            description: "No visible wrinkles with strong elasticity and even surface texture. Suggests sustained protective behaviors.",
            recommendations: [
                "Maintain current preventive routine with daily SPF and antioxidant protection.",
                "Use gentle maintenance retinoid or peptide serums to preserve collagen.",
                "Keep skin hydrated with humectants and occlusives in dry climates.",
                "Continue healthy lifestyle habits and avoid prolonged sun exposure."
            ]
        }
    },
    darkCircles: {
        Extreme: {
            title: "Prominent darkness and volume-related hollowness",
            description: "Deep pigmentation with pronounced hollowing and puffiness. Shadows from both pigment and structural changes.",
            recommendations: [
                "See dermatologist or oculoplastic specialist to evaluate volume loss and discuss treatment options.",
                "Use targeted topicals with vitamin C, niacinamide, and gentle retinoids (cautiously near eyes).",
                "Address lifestyle contributors: prioritize quality sleep, reduce late-night screens, and manage allergies.",
                "Apply daily sunscreen, wear sunglasses, and use cooling eye masks or cold compresses."
            ]
        },
        Severe: {
            title: "Marked shadows with puffiness or pigmentation",
            description: "Visible pigmentation and intermittent to persistent puffiness. May be pigmentary or fluid retention related.",
            recommendations: [
                "Apply gentle brightening eye cream with niacinamide or vitamin C; patch-test first.",
                "Assess and manage nasal allergies, sinus congestion, or sleep apnea with healthcare provider.",
                "Use nightly eyelid-appropriate moisturizers and protective sunscreen around orbital area.",
                "Consider gentle lymphatic massage, cold compresses, and limit late-day salt and alcohol."
            ]
        },
        Moderate: {
            title: "Noticeable darkness that responds to targeted care",
            description: "Under-eye circles visible but less severe. Often improve with topical treatments and lifestyle adjustments.",
            recommendations: [
                "Use brightening product with vitamin C or mild chemical exfoliants suitable for eye area.",
                "Ensure adequate iron, vitamin B12, and nutrition; check labs if fatigue or anemia suspected.",
                "Adopt consistent sleep hygiene and reduce late-night screen time.",
                "Apply cold compresses, topical caffeine serums, and protect area with sunscreen and sunglasses."
            ]
        },
        Fine: {
            title: "Barely visible, subtle under-eye shadowing",
            description: "Minor darkness present but not prominent from conversational distance. Responds well to simple care.",
            recommendations: [
                "Use hydrating eye cream with humectants to plump delicate skin.",
                "Include mild brightener like niacinamide and apply sunscreen to orbital area.",
                "Improve sleep consistency and reduce late-night screen exposure.",
                "Treat allergies, avoid eye rubbing, and use concealer for cosmetic correction when desired."
            ]
        },
        Great: {
            title: "Well-rested under-eyes with no darkness",
            description: "No perceptible under-eye pigmentation or puffiness with smooth skin. Reflects good sleep and circulation.",
            recommendations: [
                "Continue current sleep, hydration, and protective habits.",
                "Use light hydration around eyes and apply SPF carefully.",
                "Keep allergies controlled and avoid rubbing the area.",
                "Maintain antioxidant routines and use occasional cold compresses after long flights or late nights."
            ]
        }
    },
    dryness: {
        Extreme: {
            title: "Severely dry skin with barrier disruption",
            description: "Marked flaking, visible redness, and tightness. Compromised barrier increases sensitivity and discomfort.",
            recommendations: [
                "Switch immediately to fragrance-free, barrier-repair routine with ceramide-rich moisturizers morning and night.",
                "Avoid hot showers and harsh surfactants; use lukewarm water and creamy, soap-free cleanser.",
                "Include occlusive products (petrolatum or thick balms) at night to lock moisture.",
                "Use humidifier in dry environments and seek dermatologist evaluation if severe cracking occurs."
            ]
        },
        Severe: {
            title: "Dry skin with roughness and sensitivity",
            description: "Pronounced dryness with visible texture irregularities, occasional flaking, and increased product sensitivity.",
            recommendations: [
                "Use humectants (hyaluronic acid, glycerin) with emollients and ceramide-rich creams.",
                "Cleanse with gentle, hydrating cleansers and avoid daily exfoliating acids until barrier improves.",
                "Apply richer night cream and consider occlusives after moisturizer to seal hydration.",
                "Introduce products slowly, patch-test new items, and avoid alcohol-based toners."
            ]
        },
        Moderate: {
            title: "Noticeable dryness with some flaky patches",
            description: "Intermittent tightness and dry spots, especially after environmental exposure. Barrier is stressed but recoverable.",
            recommendations: [
                "Layer hydrating serum (hyaluronic acid) under nourishing moisturizer.",
                "Use cream-based cleansers and limit exfoliation to gentle, low-frequency chemical options.",
                "Apply moisturizers immediately after cleansing to trap skin moisture.",
                "Consider weekly hydrating mask and protect hands and face from harsh weather."
            ]
        },
        Fine: {
            title: "Mild dry patches with mostly balanced hydration",
            description: "Mostly comfortable and hydrated with small dry areas. Preventive hydration maintains comfort.",
            recommendations: [
                "Use balanced moisturizer with ceramides and humectants; adjust texture seasonally.",
                "Avoid over-cleansing and apply moisturizer on damp skin to maximize absorption.",
                "Keep water intake consistent and use humidifier in dry environments.",
                "Use gentle overnight mask when in drying conditions."
            ]
        },
        Great: {
            title: "Exceptionally hydrated and resilient skin",
            description: "Well-plumped, supple, and free from flaking or tightness with robust barrier function.",
            recommendations: [
                "Maintain hydration routine with humectants and appropriate occlusives.",
                "Continue gentle cleansing and avoid excessive exfoliation.",
                "Use daily sunscreen to prevent transepidermal water loss from UV damage.",
                "Monitor for medication or lifestyle changes that could alter hydration."
            ]
        }
    },
    oiliness: {
        Extreme: {
            title: "Excessive oiliness with frequent congestion",
            description: "Continuous, heavy sebum production leads to shiny complexion, clogged pores, and recurring breakouts.",
            recommendations: [
                "Use lightweight, oil-free, non-comedogenic formulations with niacinamide for sebum regulation.",
                "Include salicylic acid (BHA) treatment for pore decongestion several times weekly.",
                "Avoid harsh, astringent cleansers that trigger rebound oiliness; cleanse gently twice daily.",
                "Try clay masks once weekly and use blotting papers or mineral mattifying powders during day."
            ]
        },
        Severe: {
            title: "Oily skin with shine and breakouts",
            description: "Pronounced shine, especially in T-zone, with intermittent breakouts. Pores may appear enlarged.",
            recommendations: [
                "Include niacinamide and lightweight moisturizers to balance sebum without over-drying.",
                "Use salicylic acid products to keep pores clear and consider gentle clay masks weekly.",
                "Choose mattifying, oil-free sunscreens and foundations designed for oily skin.",
                "Limit heavy emollients and consider discussing hormonal drivers with healthcare provider if sudden."
            ]
        },
        Moderate: {
            title: "Moderate oiliness primarily in T-zone",
            description: "Noticeable shine in central face, but skin otherwise performs well. Breakouts occasional and respond to treatment.",
            recommendations: [
                "Apply light, oil-free moisturizer and use targeted BHA treatments on T-zone.",
                "Use mattifying primers or powder when needed; avoid heavy makeup that clogs pores.",
                "Keep consistent cleansing routine and don't over-cleanse as it increases oil rebound.",
                "Use sunscreen formulated for oily skin and include lightweight hydrating serums."
            ]
        },
        Fine: {
            title: "Mild oiliness with healthy natural glow",
            description: "Slight, natural sheen noticeable mainly at day's end with well-maintained pores and rare breakouts.",
            recommendations: [
                "Use gentle cleanser and light, non-comedogenic moisturizer.",
                "Monitor seasonal changes and switch to lighter formulations in humid months.",
                "Use blotting papers when needed rather than washing again.",
                "Select oil-free sunscreens and maintain simple nighttime routine to remove accumulated oil."
            ]
        },
        Great: {
            title: "Balanced skin with optimal sebum production",
            description: "Well-regulated sebum production gives complexion healthy radiance without excess shine or congestion.",
            recommendations: [
                "Continue balanced routine — gentle cleansing, lightweight hydration, daily SPF.",
                "Use occasional gentle exfoliation to support pore clarity.",
                "Avoid overly harsh oil-control products that could disrupt barrier.",
                "Maintain healthy habits and keep skincare consistent with seasonal adjustments only."
            ]
        }
    },
    pores: {
        Extreme: {
            title: "Visibly congested pores with uneven texture",
            description: "Markedly enlarged pores filled with oil, blackheads, or debris, producing rough, uneven skin surface.",
            recommendations: [
                "Start regular chemical exfoliation routine (salicylic acid/BHA) to penetrate and clear pores.",
                "Use clay masks periodically and avoid heavy creams and comedogenic ingredients.",
                "Consider professional extraction and maintenance facials by qualified esthetician or dermatologist.",
                "Include niacinamide to help reduce pore visibility and regulate sebum."
            ]
        },
        Severe: {
            title: "Enlarged pores with recurrent congestion",
            description: "Visible pores across T-zone or cheeks with mild congestion. Regular care can improve appearance.",
            recommendations: [
                "Use topical BHA (salicylic acid) and retinoids to speed cell turnover and clean pore linings.",
                "Include weekly clay mask and maintain consistent cleansing to prevent buildup.",
                "Use lightweight, non-comedogenic moisturizers and oil-free sunscreens.",
                "Consider in-office treatments and avoid excessive pore squeezing which worsens texture."
            ]
        },
        Moderate: {
            title: "Moderate pores with occasional congestion",
            description: "Noticeable but not heavily blocked pores with small blackheads or texture variation occasionally.",
            recommendations: [
                "Apply niacinamide serums to help minimize pore appearance and strengthen barrier function.",
                "Use gentle BHA exfoliation 1-3 times weekly depending on tolerance.",
                "Keep skin clean from excess oil, makeup, and environmental debris with double cleansing when necessary.",
                "Apply daily sunscreen to prevent UV-related collagen breakdown and use lightweight hydrating products."
            ]
        },
        Fine: {
            title: "Well-maintained pores with smooth texture",
            description: "Minimal pores with even skin surface. Occasional debris may appear but routine care maintains clarity.",
            recommendations: [
                "Maintain gentle exfoliation schedule and use non-comedogenic products.",
                "Continue daily sun protection to preserve collagen support around pores.",
                "Keep makeup tools and pillowcases clean to reduce transfer and buildup.",
                "Stay consistent with cleansing and use occasional clay masks if experiencing congestion."
            ]
        },
        Great: {
            title: "Nearly invisible pores with smooth skin",
            description: "Exceptionally refined texture with minimal pore visibility. Indicates effective cell turnover.",
            recommendations: [
                "Keep up maintenance regimen: gentle cleansing, light exfoliation, daily SPF.",
                "Use hydrating serums and lightweight moisturizers to support skin resilience.",
                "Avoid harsh manual exfoliation that can enlarge pores over time.",
                "Protect skin from UV exposure and consider occasional professional maintenance treatments if desired."
            ]
        }
    },
    redness: {
        Extreme: {
            title: "Persistent redness with visible inflammation",
            description: "Persistent erythema often with heat, stinging, or broken capillaries. May signal inflammatory conditions.",
            recommendations: [
                "See dermatologist to evaluate for rosacea, dermatitis, or inflammatory disorders.",
                "Eliminate potential irritants: fragrance, alcohol, essential oils, and high-concentration acids.",
                "Use barrier-repair moisturizers with ceramides and niacinamide; avoid physical exfoliation.",
                "Apply mineral-based sunscreen and use cool compresses while limiting triggers."
            ]
        },
        Severe: {
            title: "Significant redness with flushing and sensitivity",
            description: "Persistent redness across cheeks, nose, or other areas with frequent flushing episodes and sensitivity.",
            recommendations: [
                "Switch to fragrance-free, minimal-ingredient formulations and patch-test all new products.",
                "Use anti-inflammatory topicals (azelaic acid, niacinamide, or physician-recommended therapies).",
                "Apply daily mineral sunscreen and protective clothing to minimize UV triggers.",
                "Identify and avoid triggers; consult dermatologist for tailored medical options if redness persists."
            ]
        },
        Moderate: {
            title: "Redness and reactive skin prone to flare-ups",
            description: "Redness appears regularly after triggers or in reaction to certain products. Skin is reactive but not continuously inflamed.",
            recommendations: [
                "Use calming ingredients such as centella asiatica (cica), allantoin, or colloidal oatmeal.",
                "Avoid strong physical exfoliants and lower frequency/intensity of chemical exfoliation.",
                "Apply daily SPF and avoid long hot showers or heat exposures that exacerbate redness.",
                "Include antioxidants to support barrier resilience and consider dermatologist consultation if reactions are frequent."
            ]
        },
        Fine: {
            title: "Mild redness that subsides with care",
            description: "Slight redness occurs after identifiable triggers but returns to even tone with rest and calming care.",
            recommendations: [
                "Use gentle, fragrance-free moisturizers and limit abrasive treatments.",
                "Apply cold compresses or calming masks after activities causing flushing.",
                "Patch-test new products and introduce actives slowly.",
                "Protect skin daily with SPF and monitor diet and stress which can influence flare frequency."
            ]
        },
        Great: {
            title: "Calm skin with no visible redness",
            description: "No observable redness with balanced, even-toned skin resilient to common triggers. Reflects well-functioning barrier.",
            recommendations: [
                "Maintain gentle, fragrance-free routines and daily sun protection.",
                "Continue using barrier-supporting ingredients like ceramides and humectants.",
                "Avoid introducing high-risk irritants and keep product changes minimal.",
                "Use soothing treatments periodically and monitor environment and lifestyle for increased reactivity."
            ]
        }
    },
    tone: {
        Extreme: {
            title: "Widespread uneven tone and hyperpigmentation",
            description: "Large areas of discoloration or post-inflammatory hyperpigmentation significantly affecting overall appearance.",
            recommendations: [
                "Consult dermatologist for assessment and discuss professional options (chemical peels, laser, prescription lightening agents).",
                "Begin consistent brightening routine with stable vitamin C in morning and suitable topical in evening.",
                "Apply broad-spectrum SPF 30+ every morning and reapply frequently; consider SPF 50+ for higher-risk conditions.",
                "Avoid picking, aggressive exfoliation, or trauma to pigmented areas and consider in-office procedures."
            ]
        },
        Severe: {
            title: "Noticeable pigmentation and dark spots",
            description: "Visible patches of hyperpigmentation or darker spots across several areas with overall blotchy tone appearance.",
            recommendations: [
                "Use stable vitamin C serum each morning and targeted evening product such as niacinamide or azelaic acid.",
                "Include gentle exfoliation to aid turnover and reduce pigment retention; avoid overuse.",
                "Prioritize daily high-SPF application and sun protective measures (hats, shade).",
                "Track product use carefully and consider professional-strength treatments after consultation."
            ]
        },
        Moderate: {
            title: "Mild uneven tone with some dark spots",
            description: "Visible discoloration with few dark spots or slight overall dullness. Ideal stage for topical brightening.",
            recommendations: [
                "Include vitamin C or other antioxidants in AM and use nightly agents like niacinamide.",
                "Use broad-spectrum sunscreen daily and reapply when outdoors.",
                "Add gentle weekly exfoliation to promote turnover and fade spots over time.",
                "Consider spot treatments for persistent dark areas and address hormonal contributors with healthcare provider."
            ]
        },
        Fine: {
            title: "Slight unevenness of facial tone",
            description: "Minor tone differences or few faint spots visible but overall complexion reads as fairly even.",
            recommendations: [
                "Use daily SPF and gentle antioxidant serum to maintain brightness and prevent future spots.",
                "Include mild weekly exfoliant to support surface renewal and fade slight hyperpigmentation.",
                "Apply targeted niacinamide products to blur and even tone subtly over time.",
                "Use concealer for cosmetic correction and avoid prolonged sun exposure and tanning beds."
            ]
        },
        Great: {
            title: "Even skin tone with uniform brightness",
            description: "Even color and radiant quality across face with no visible dark spots. Suggests excellent photoprotection.",
            recommendations: [
                "Maintain daily antioxidant and sunscreen use to preserve even tone.",
                "Continue mild exfoliation and hydration to support cell turnover and glow.",
                "Protect skin from peak sun hours and use physical barriers when needed.",
                "Keep up balanced lifestyle and monitor for new spots to treat early with targeted actives."
            ]
        }
    }
};

export default ConcernSeverityBreakdowns;