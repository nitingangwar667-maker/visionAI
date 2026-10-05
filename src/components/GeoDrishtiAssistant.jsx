import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  MapPinned,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const INDEX_GUIDE = {
  ndvi: {
    label: "vegetation greenness",
    explanation:
      "NDVI compares near-infrared and red reflectance. It is a vegetation greenness signal, not a direct measurement of plant health or biomass.",
    interpret: (value) =>
      value < 0.2
        ? "This is a relatively low greenness signal; exposed soil, dry vegetation, water, or sparse cover can contribute."
        : value < 0.5
          ? "This is a moderate greenness signal, commonly associated with some active vegetation cover."
          : "This is a relatively strong greenness signal, often associated with denser green cover.",
  },
  ndwi: {
    label: "surface-water signal",
    explanation:
      "NDWI compares green and near-infrared reflectance. It helps screen for open-water or surface-moisture signals; it is not a water-depth measurement.",
    interpret: (value) =>
      value < -0.1
        ? "This is a relatively low water signal for the displayed index scale."
        : value < 0.3
          ? "This is a moderate water signal; check the imagery and local conditions."
          : "This is a relatively strong water signal, which can be consistent with surface water.",
  },
  smi: {
    label: "surface-moisture proxy",
    explanation:
      "SMI here is derived from near-infrared and shortwave-infrared reflectance. Treat it as a relative surface-moisture proxy, not measured soil-water content.",
    interpret: (value) =>
      value < 0.1
        ? "This is a relatively low moisture-proxy signal."
        : value < 0.3
          ? "This is a moderate moisture-proxy signal."
          : "This is a relatively high moisture-proxy signal.",
  },
  ndti: {
    label: "turbidity-related signal",
    explanation:
      "NDTI compares red and green reflectance and can help screen for suspended material in water. It is not a direct sediment concentration measurement.",
    interpret: (value) =>
      value < 0.1
        ? "This is a relatively low turbidity-related signal."
        : value < 0.3
          ? "This is a moderate turbidity-related signal."
          : "This is a relatively high signal; confirm it with field observations and water conditions.",
  },
  bsi: {
    label: "bare-soil signal",
    explanation:
      "BSI combines visible, near-infrared, and shortwave-infrared reflectance to highlight relatively exposed soil. It does not by itself prove erosion.",
    interpret: (value) =>
      value < 0
        ? "This is a relatively low bare-soil signal."
        : value < 0.2
          ? "This is a moderate bare-soil signal."
          : "This is a relatively high exposed-soil signal; inspect the location and land cover before drawing conclusions.",
  },
  evi: {
    label: "enhanced vegetation signal",
    explanation:
      "EVI is a vegetation index designed to retain sensitivity in greener or denser canopy. It remains a satellite indicator, not a field measurement.",
    interpret: (value) =>
      value < 0.2
        ? "This is a relatively low enhanced-vegetation signal."
        : value < 0.5
          ? "This is a moderate enhanced-vegetation signal."
          : "This is a relatively strong enhanced-vegetation signal.",
  },
};

const TAB_NAMES = {
  home: "Home",
  map: "Map",
  upload: "Upload",
  monitoring: "Monitoring",
  vault: "Offline vault",
  about: "About",
};

const QUICK_QUESTIONS = [
  "What does my latest data mean?",
  "Explain the map heat colours",
  "Where do I upload a field photo?",
];

const CHAT_LANGUAGES = {
  en: {
    name: "English",
    guide: "Drishti guide",
    here: "Here to help",
    offline: "Available offline",
    close: "Close help chat",
    conversation: "Conversation",
    placeholder: "Ask about the site or your data…",
    input: "Ask the Drishti guide",
    send: "Send message",
    map: "Map",
    monitoring: "Monitoring",
    tour: "Tour",
    disclaimer: "Site guide · Indices are screening indicators, not field measurements.",
    welcome: "Ask me about the map, an index, or your saved records.",
    prompts: QUICK_QUESTIONS,
  },
  hi: {
    name: "हिन्दी",
    guide: "Drishti सहायक",
    here: "मदद के लिए उपलब्ध",
    offline: "ऑफ़लाइन उपलब्ध",
    close: "सहायता चैट बंद करें",
    conversation: "बातचीत",
    placeholder: "साइट या अपने डेटा के बारे में पूछें…",
    input: "Drishti सहायक से पूछें",
    send: "संदेश भेजें",
    map: "मानचित्र",
    monitoring: "निगरानी",
    tour: "परिचय",
    disclaimer: "साइट मार्गदर्शिका · सूचक केवल संकेत हैं, जमीनी माप नहीं।",
    welcome: "मानचित्र, सूचकांक या सहेजे गए रिकॉर्ड के बारे में पूछें।",
    prompts: ["मेरा नया डेटा क्या बताता है?", "हीटमैप के रंग समझाएँ", "फील्ड फोटो कहाँ अपलोड करूँ?"],
  },
  kn: {
    name: "ಕನ್ನಡ",
    guide: "Drishti ಮಾರ್ಗದರ್ಶಿ",
    here: "ಸಹಾಯಕ್ಕೆ ಲಭ್ಯ",
    offline: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಲಭ್ಯ",
    close: "ಸಹಾಯ ಚಾಟ್ ಮುಚ್ಚಿ",
    conversation: "ಸಂಭಾಷಣೆ",
    placeholder: "ಸೈಟ್ ಅಥವಾ ನಿಮ್ಮ ಡೇಟಾ ಬಗ್ಗೆ ಕೇಳಿ…",
    input: "Drishti ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಕೇಳಿ",
    send: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
    map: "ನಕ್ಷೆ",
    monitoring: "ಮೇಲ್ವಿಚಾರಣೆ",
    tour: "ಪರಿಚಯ",
    disclaimer: "ಸೈಟ್ ಮಾರ್ಗದರ್ಶಿ · ಸೂಚ್ಯಂಕಗಳು ಕೇವಲ ಸೂಚನೆಗಳು, ಕ್ಷೇತ್ರದ ಅಳತೆಗಳಲ್ಲ.",
    welcome: "ನಕ್ಷೆ, ಸೂಚ್ಯಂಕ ಅಥವಾ ಉಳಿಸಿದ ದಾಖಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    prompts: ["ನನ್ನ ಇತ್ತೀಚಿನ ಡೇಟಾ ಏನು ಹೇಳುತ್ತದೆ?", "ಹೀಟ್‌ಮ್ಯಾಪ್ ಬಣ್ಣಗಳನ್ನು ವಿವರಿಸಿ", "ಕ್ಷೇತ್ರದ ಫೋಟೋವನ್ನು ಎಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಿ?"],
  },
};

const LOCALIZED_INDEX_GUIDE = {
  hi: {
    ndvi: ["वनस्पति हरियाली संकेत", "NDVI लाल और निकट-अवरक्त परावर्तन की तुलना करता है। यह हरियाली का संकेत है, पौधों के स्वास्थ्य या बायोमास का प्रत्यक्ष माप नहीं।", ["हरियाली का संकेत कम है; खुली मिट्टी, सूखी वनस्पति, पानी या विरल आवरण इसका कारण हो सकते हैं।", "हरियाली का संकेत मध्यम है; यह कुछ सक्रिय वनस्पति आवरण के अनुरूप हो सकता है।", "हरियाली का संकेत अपेक्षाकृत अधिक है; यह घने हरे आवरण के अनुरूप हो सकता है।"]],
    ndwi: ["सतही जल संकेत", "NDWI हरे और निकट-अवरक्त परावर्तन की तुलना करता है। यह खुले पानी या सतही नमी का संकेत देता है, पानी की गहराई नहीं।", ["जल संकेत अपेक्षाकृत कम है।", "जल संकेत मध्यम है; चित्र और स्थानीय स्थिति भी जाँचें।", "जल संकेत अपेक्षाकृत अधिक है और सतही पानी के अनुरूप हो सकता है।"]],
    smi: ["सतही नमी का अनुमान", "यहाँ SMI निकट-अवरक्त और शॉर्टवेव-अवरक्त परावर्तन से निकला सतही नमी का सापेक्ष अनुमान है, मिट्टी के पानी की प्रत्यक्ष माप नहीं।", ["नमी का अनुमानित संकेत कम है।", "नमी का अनुमानित संकेत मध्यम है।", "नमी का अनुमानित संकेत अधिक है।"]],
    ndti: ["गंदलेपन से जुड़ा संकेत", "NDTI लाल और हरे परावर्तन की तुलना करके पानी में निलंबित पदार्थों का संकेत दे सकता है। यह तलछट की प्रत्यक्ष मात्रा नहीं है।", ["गंदलेपन से जुड़ा संकेत कम है।", "गंदलेपन से जुड़ा संकेत मध्यम है।", "संकेत अधिक है; इसे क्षेत्रीय निरीक्षण से सत्यापित करें।"]],
    bsi: ["खुली मिट्टी का संकेत", "BSI अपेक्षाकृत खुली मिट्टी दिखाने में मदद करता है; यह अपने आप में कटाव का प्रमाण नहीं है।", ["खुली मिट्टी का संकेत कम है।", "खुली मिट्टी का संकेत मध्यम है।", "खुली मिट्टी का संकेत अधिक है; निष्कर्ष से पहले स्थान और भूमि आवरण जाँचें।"]],
    evi: ["उन्नत वनस्पति संकेत", "EVI हरित या घने वनस्पति आवरण में संवेदनशीलता बनाए रखने के लिए बनाया गया है। यह फिर भी उपग्रह संकेत है, जमीनी माप नहीं।", ["वनस्पति संकेत कम है।", "वनस्पति संकेत मध्यम है।", "वनस्पति संकेत अपेक्षाकृत अधिक है।"]],
  },
  kn: {
    ndvi: ["ಸಸ್ಯ ಹಸಿರು ಸೂಚನೆ", "NDVI ಕೆಂಪು ಮತ್ತು ಸಮೀಪ-ಅತಿಗೆಂಪು ಪ್ರತಿಫಲನವನ್ನು ಹೋಲಿಸುತ್ತದೆ. ಇದು ಸಸ್ಯ ಹಸಿರಿನ ಸೂಚನೆ ಮಾತ್ರ; ಸಸ್ಯ ಆರೋಗ್ಯ ಅಥವಾ ಜೈವಿಕ ದ್ರವ್ಯರಾಶಿಯ ನೇರ ಅಳತೆಯಲ್ಲ.", ["ಹಸಿರಿನ ಸೂಚನೆ ಕಡಿಮೆ; ಬಯಲು ಮಣ್ಣು, ಒಣ ಸಸ್ಯಾವರಣ, ನೀರು ಅಥವಾ ವಿರಳ ಸಸ್ಯಾವರಣ ಕಾರಣವಾಗಿರಬಹುದು.", "ಹಸಿರಿನ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ; ಇದು ಕೆಲವು ಸಕ್ರಿಯ ಸಸ್ಯಾವರಣಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗಬಹುದು.", "ಹಸಿರಿನ ಸೂಚನೆ ಹೆಚ್ಚು; ಇದು ದಟ್ಟ ಹಸಿರು ಸಸ್ಯಾವರಣಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗಬಹುದು."]],
    ndwi: ["ಮೇಲ್ಮೈ ನೀರಿನ ಸೂಚನೆ", "NDWI ಹಸಿರು ಮತ್ತು ಸಮೀಪ-ಅತಿಗೆಂಪು ಪ್ರತಿಫಲನವನ್ನು ಹೋಲಿಸುತ್ತದೆ. ಇದು ಮೇಲ್ಮೈ ನೀರಿನ ಸೂಚನೆ, ನೀರಿನ ಆಳದ ಅಳತೆಯಲ್ಲ.", ["ನೀರಿನ ಸೂಚನೆ ಕಡಿಮೆಯಾಗಿದೆ.", "ನೀರಿನ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ; ಚಿತ್ರ ಮತ್ತು ಸ್ಥಳೀಯ ಪರಿಸ್ಥಿತಿಯನ್ನೂ ಪರಿಶೀಲಿಸಿ.", "ನೀರಿನ ಸೂಚನೆ ಹೆಚ್ಚಾಗಿದೆ; ಇದು ಮೇಲ್ಮೈ ನೀರಿಗೆ ಹೊಂದಿಕೆಯಾಗಬಹುದು."]],
    smi: ["ಮೇಲ್ಮೈ ತೇವಾಂಶದ ಅಂದಾಜು", "ಇಲ್ಲಿನ SMI ಸಮೀಪ-ಅತಿಗೆಂಪು ಮತ್ತು ಶಾರ್ಟ್‌ವೇವ್-ಅತಿಗೆಂಪು ಪ್ರತಿಫಲನದಿಂದ ಪಡೆದ ಸಾಪೇಕ್ಷ ತೇವಾಂಶ ಸೂಚನೆ; ಮಣ್ಣಿನ ನೀರಿನ ನೇರ ಅಳತೆಯಲ್ಲ.", ["ತೇವಾಂಶದ ಸೂಚನೆ ಕಡಿಮೆಯಾಗಿದೆ.", "ತೇವಾಂಶದ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ.", "ತೇವಾಂಶದ ಸೂಚನೆ ಹೆಚ್ಚಾಗಿದೆ."]],
    ndti: ["ಮಂಕುತನಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಸೂಚನೆ", "NDTI ಕೆಂಪು ಮತ್ತು ಹಸಿರು ಪ್ರತಿಫಲನವನ್ನು ಹೋಲಿಸಿ ನೀರಿನಲ್ಲಿನ ತೇಲುವ ಕಣಗಳ ಸೂಚನೆ ನೀಡುತ್ತದೆ. ಇದು ಗಡ್ಡೆಯ ನೇರ ಪ್ರಮಾಣವಲ್ಲ.", ["ಮಂಕುತನದ ಸೂಚನೆ ಕಡಿಮೆಯಾಗಿದೆ.", "ಮಂಕುತನದ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ.", "ಸೂಚನೆ ಹೆಚ್ಚಾಗಿದೆ; ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆಯಿಂದ ದೃಢಪಡಿಸಿ."]],
    bsi: ["ಬಯಲು ಮಣ್ಣಿನ ಸೂಚನೆ", "BSI ಬಯಲಾಗಿರುವ ಮಣ್ಣನ್ನು ಗುರುತಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ; ಇದು ಮಾತ್ರದಿಂದ ಮಣ್ಣಿನ ಸವೆತ ಸಾಬೀತಾಗುವುದಿಲ್ಲ.", ["ಬಯಲು ಮಣ್ಣಿನ ಸೂಚನೆ ಕಡಿಮೆಯಾಗಿದೆ.", "ಬಯಲು ಮಣ್ಣಿನ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ.", "ಬಯಲು ಮಣ್ಣಿನ ಸೂಚನೆ ಹೆಚ್ಚಾಗಿದೆ; ತೀರ್ಮಾನಕ್ಕೂ ಮೊದಲು ಸ್ಥಳ ಮತ್ತು ಭೂಆವರಣ ಪರಿಶೀಲಿಸಿ."]],
    evi: ["ಸುಧಾರಿತ ಸಸ್ಯ ಸೂಚನೆ", "EVI ಹಸಿರು ಅಥವಾ ದಟ್ಟ ಸಸ್ಯಾವರಣದಲ್ಲಿ ಸಂವೇದನಾಶೀಲತೆಯನ್ನು ಉಳಿಸಲು ರೂಪಿಸಲಾಗಿದೆ. ಇದು ಉಪಗ್ರಹ ಸೂಚನೆ, ಕ್ಷೇತ್ರದ ಅಳತೆಯಲ್ಲ.", ["ಸಸ್ಯ ಸೂಚನೆ ಕಡಿಮೆಯಾಗಿದೆ.", "ಸಸ್ಯ ಸೂಚನೆ ಮಧ್ಯಮವಾಗಿದೆ.", "ಸಸ್ಯ ಸೂಚನೆ ಹೆಚ್ಚಾಗಿದೆ."]],
  },
};

const LOCALIZED_INDEX_NAMES = {
  hi: { ndvi: "वनस्पति", ndwi: "जल", smi: "नमी", ndti: "गाद", bsi: "खुली मिट्टी", evi: "वनस्पति" },
  kn: { ndvi: "ಸಸ್ಯ", ndwi: "ನೀರು", smi: "ತೇವಾಂಶ", ndti: "ಮಂಕುತನ", bsi: "ಬಯಲು ಮಣ್ಣು", evi: "ಸಸ್ಯ" },
};

function localizedInterpretation(indexKey, value, language) {
  const thresholds = {
    ndvi: [0.2, 0.5],
    ndwi: [-0.1, 0.3],
    smi: [0.1, 0.3],
    ndti: [0.1, 0.3],
    bsi: [0, 0.2],
    evi: [0.2, 0.5],
  };
  const [low, high] = thresholds[indexKey];
  const interpretations = LOCALIZED_INDEX_GUIDE[language][indexKey][2];
  return value < low ? interpretations[0] : value < high ? interpretations[1] : interpretations[2];
}

function localizedIndexReply(indexKey, summary, language) {
  const [label, explanation] = LOCALIZED_INDEX_GUIDE[language][indexKey];
  const latest = summary?.indices?.at(-1);
  const value = latest?.[indexKey];
  const unavailable = language === "hi"
    ? `अभी ${indexKey.toUpperCase()} का नया मान उपलब्ध नहीं है। डेटा आने के बाद निगरानी पृष्ठ देखें।`
    : `ಇದೀಗ ${indexKey.toUpperCase()} ನ ಇತ್ತೀಚಿನ ಮೌಲ್ಯ ಲಭ್ಯವಿಲ್ಲ. ಡೇಟಾ ಬಂದ ನಂತರ ಮೇಲ್ವಿಚಾರಣೆ ಪುಟವನ್ನು ನೋಡಿ.`;
  if (!Number.isFinite(value)) return `${indexKey.toUpperCase()} — ${label}। ${explanation}\n\n${unavailable}`;
  const interpretation = localizedInterpretation(indexKey, value, language);
  const source = latest.source === "sentinel-2"
    ? language === "hi" ? "यह रिकॉर्ड Sentinel-2 के रूप में चिह्नित है।" : "ಈ ದಾಖಲೆ Sentinel-2 ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ."
    : language === "hi" ? "यह रिकॉर्ड अनुमान के रूप में चिह्नित है, Sentinel-2 पिक्सेल अवलोकन नहीं।" : "ಈ ದಾಖಲೆ ಅಂದಾಜು ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ; Sentinel-2 ಪಿಕ್ಸೆಲ್ ವೀಕ್ಷಣೆಯಲ್ಲ."
  return language === "hi"
    ? `${indexKey.toUpperCase()} (${label}) का ${latest.year} का मान ${value.toFixed(3)} है। ${interpretation}\n\n${explanation}\n\n${source} यह संकेतक है, जमीनी माप का विकल्प नहीं।`
    : `${indexKey.toUpperCase()} (${label}) ${latest.year}ರ ಮೌಲ್ಯ ${value.toFixed(3)}. ${interpretation}\n\n${explanation}\n\n${source} ಇದು ಸೂಚಕ ಮಾತ್ರ; ಕ್ಷೇತ್ರದ ಅಳತೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.`;
}

function localizedAnswerQuestion(question, context, language) {
  const text = question.toLowerCase();
  const isHindi = language === "hi";
  const words = isHindi
    ? {
        greeting: /नमस्ते|हैलो|हाय|धन्यवाद/,
        tour: /टूर|परिचय|शुरू|शुरुआत|सीख/,
        help: /मदद|सुविधा|क्या कर|क्या है|जानकारी/,
        heat: /हीट.?मैप|रंग|पिक्सेल/,
        upload: /अपलोड|फोटो|कैमरा|ऑडिट|तस्वीर/,
        offline: /ऑफ़लाइन|ऑफलाइन|वॉल्ट|सिंक|सहेज/,
        source: /स्रोत|सैटेलाइट|उपग्रह|अनुमान|sentinel/,
        latest: /डेटा|रीडिंग|मान|साल|वर्ष|सूचक|ट्रेंड/,
        map: /स्थान|निर्देशांक|जलागम|बेसिन|कहाँ|कहां/,
        water: /पानी|जल/,
        vegetation: /वनस्पति|हरियाली|पौधा/,
        moisture: /नमी|मिट्टी/,
        sediment: /गाद|गंदल/,
      }
    : {
        greeting: /ನಮಸ್ಕಾರ|ಹಲೋ|ಹಾಯ್|ಧನ್ಯವಾದ/,
        tour: /ಪರಿಚಯ|ಮಾರ್ಗದರ್ಶಿ|ಪ್ರಾರಂಭ|ಆರಂಭ|ಕಲಿ/,
        help: /ಸಹಾಯ|ವೈಶಿಷ್ಟ್ಯ|ಏನು ಮಾಡ|ಏನಿದು|ಮಾಹಿತಿ/,
        heat: /ಹೀಟ್.?ಮ್ಯಾಪ್|ಬಣ್ಣ|ಪಿಕ್ಸೆಲ್/,
        upload: /ಅಪ್.?ಲೋಡ್|ಫೋಟೋ|ಕ್ಯಾಮೆರಾ|ಆಡಿಟ್|ಚಿತ್ರ/,
        offline: /ಆಫ್.?ಲೈನ್|ವಾಲ್ಟ್|ಸಿಂಕ್|ಉಳಿಸು/,
        source: /ಮೂಲ|ಉಪಗ್ರಹ|ಅಂದಾಜು|sentinel/,
        latest: /ಡೇಟಾ|ಓದು|ಮೌಲ್ಯ|ವರ್ಷ|ಸೂಚ್ಯಂಕ|ಟ್ರೆಂಡ್/,
        map: /ಸ್ಥಳ|ನಿರ್ದೇಶಾಂಕ|ಜಲಾನಯನ|ಎಲ್ಲಿ/,
        water: /ನೀರು/,
        vegetation: /ಸಸ್ಯ|ಹಸಿರು/,
        moisture: /ತೇವಾಂಶ|ಮಣ್ಣು/,
        sediment: /ಮಂಕುತನ|ಕೆಸರು|ಗಡ್ಡೆ/,
      };
  const indexMatch = text.match(/\b(ndvi|ndwi|smi|ndti|bsi|evi)\b/);
  if (indexMatch) return localizedIndexReply(indexMatch[1], context.auditSummary, language);
  if (words.greeting.test(text)) {
    return isHindi
      ? `नमस्ते! मैं मानचित्र, उपग्रह सूचकांकों, फील्ड ऑडिट और ऑफ़लाइन वॉल्ट में मदद कर सकता हूँ। आप अभी ${TAB_NAMES[context.activeTab] ?? "साइट"} पर हैं।`
      : `ನಮಸ್ಕಾರ! ನಕ್ಷೆ, ಉಪಗ್ರಹ ಸೂಚ್ಯಂಕಗಳು, ಕ್ಷೇತ್ರ ಆಡಿಟ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ವಾಲ್ಟ್ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಈಗ ${TAB_NAMES[context.activeTab] ?? "ಸೈಟ್"} ವಿಭಾಗದಲ್ಲಿದ್ದೀರಿ.`;
  }
  if (words.tour.test(text)) {
    context.onStartTour();
    return isHindi
      ? "परिचय टूर शुरू कर दिया है। इसमें नेविगेशन, जलागम मानचित्र, निगरानी, फील्ड ऑडिट और ऑफ़लाइन रिकॉर्ड दिखाए जाएँगे।"
      : "ಪರಿಚಯ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಪ್ರಾರಂಭಿಸಿದ್ದೇನೆ. ಇದರಲ್ಲಿ ನ್ಯಾವಿಗೇಶನ್, ಜಲಾನಯನ ನಕ್ಷೆ, ಮೇಲ್ವಿಚಾರಣೆ, ಕ್ಷೇತ್ರ ಆಡಿಟ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ.";
  }
  if (words.heat.test(text)) {
    const heatmap = context.heatmapSummary;
    if (!heatmap) {
      return isHindi
        ? "मानचित्र में सूचकांक और वर्ष चुनें। हीटमैप केवल उपलब्ध Sentinel-2 पिक्सेल से बनता है; इसके नीचे औसत, सीमा और कम/मध्यम/अधिक पिक्सेल संख्या दिखाई जाती है।"
        : "ನಕ್ಷೆಯಲ್ಲಿ ಸೂಚ್ಯಂಕ ಮತ್ತು ವರ್ಷ ಆಯ್ಕೆಮಾಡಿ. ಹೀಟ್‌ಮ್ಯಾಪ್ ಲಭ್ಯವಿರುವ Sentinel-2 ಪಿಕ್ಸೆಲ್‌ಗಳಿಂದ ಮಾತ್ರ ತಯಾರಾಗುತ್ತದೆ; ಅದರ ಕೆಳಗೆ ಸರಾಸರಿ, ವ್ಯಾಪ್ತಿ ಮತ್ತು ಕಡಿಮೆ/ಮಧ್ಯಮ/ಹೆಚ್ಚಿನ ಪಿಕ್ಸೆಲ್ ಸಂಖ್ಯೆಗಳು ಕಾಣಿಸುತ್ತವೆ.";
    }
    return isHindi
      ? `${heatmap.index.toUpperCase()} (${heatmap.year}) हीटमैप में ${heatmap.validPixels} मान्य पिक्सेल हैं। औसत ${heatmap.mean.toFixed(3)} है और सीमा ${heatmap.min.toFixed(3)} से ${heatmap.max.toFixed(3)} तक है। वर्गीकरण: ${heatmap.classes.low} कम, ${heatmap.classes.medium} मध्यम, ${heatmap.classes.high} अधिक। “अधिक” का अर्थ सूचकांक का मान अधिक है, यह हमेशा बेहतर स्थिति नहीं दर्शाता।`
      : `${heatmap.index.toUpperCase()} (${heatmap.year}) ಹೀಟ್‌ಮ್ಯಾಪ್‌ನಲ್ಲಿ ${heatmap.validPixels} ಮಾನ್ಯ ಪಿಕ್ಸೆಲ್‌ಗಳಿವೆ. ಸರಾಸರಿ ${heatmap.mean.toFixed(3)}; ವ್ಯಾಪ್ತಿ ${heatmap.min.toFixed(3)} ರಿಂದ ${heatmap.max.toFixed(3)}. ವರ್ಗಗಳು: ${heatmap.classes.low} ಕಡಿಮೆ, ${heatmap.classes.medium} ಮಧ್ಯಮ, ${heatmap.classes.high} ಹೆಚ್ಚು. “ಹೆಚ್ಚು” ಎಂದರೆ ಸೂಚ್ಯಂಕದ ಮೌಲ್ಯ ಹೆಚ್ಚು; ಅದು ಯಾವಾಗಲೂ ಉತ್ತಮ ಸ್ಥಿತಿ ಎಂದಲ್ಲ.`;
  }
  if (words.upload.test(text)) {
    return isHindi
      ? "फील्ड फोटो के लिए Upload खोलें, कैमरा अनुमति दें और फोटो लें या जाँचें। ऑनलाइन होने पर फील्ड ऑडिट जमा होगा; ऑफ़लाइन होने पर रिकॉर्ड इसी ब्राउज़र के Offline vault में रहेगा और बाद में सिंक किया जा सकता है।"
      : "ಕ್ಷೇತ್ರದ ಫೋಟೋಗಾಗಿ Upload ತೆರೆಯಿರಿ, ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನೀಡಿ ಮತ್ತು ಫೋಟೋ ತೆಗೆದು ಪರಿಶೀಲಿಸಿ. ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಕ್ಷೇತ್ರ ಆಡಿಟ್ ಸಲ್ಲಿಕೆಯಾಗುತ್ತದೆ; ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ದಾಖಲೆ ಈ ಬ್ರೌಸರ್‌ನ Offline vault ನಲ್ಲಿ ಉಳಿದು ನಂತರ ಸಿಂಕ್ ಮಾಡಬಹುದು.";
  }
  if (words.offline.test(text)) {
    return isHindi
      ? `इस ब्राउज़र के Offline vault में ${context.pendingCount} लंबित रिकॉर्ड हैं। कनेक्शन उपलब्ध होने पर उन्हें जाँचकर सिंक करें।`
      : `ಈ ಬ್ರೌಸರ್‌ನ Offline vault ನಲ್ಲಿ ${context.pendingCount} ಬಾಕಿ ದಾಖಲೆಗಳಿವೆ. ಸಂಪರ್ಕ ಲಭ್ಯವಾದಾಗ ಅವುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಸಿಂಕ್ ಮಾಡಿ.`;
  }
  if (words.source.test(text)) {
    const records = context.auditSummary?.indices ?? [];
    const realCount = records.filter((record) => record.source === "sentinel-2").length;
    return isHindi
      ? `Monitoring में वास्तविक उपग्रह पिक्सेल वाले साल Sentinel-2 के रूप में और अनुमान वाले साल estimate के रूप में चिह्नित होते हैं। अभी ${records.length} में से ${realCount} रिकॉर्ड Sentinel-2 हैं। हीटमैप अनुमानित पिक्सेल नहीं दिखाता।`
      : `Monitoring ನಲ್ಲಿ ನಿಜವಾದ ಉಪಗ್ರಹ ಪಿಕ್ಸೆಲ್‌ಗಳ ವರ್ಷಗಳನ್ನು Sentinel-2 ಎಂದು, ಅಂದಾಜುಗಳನ್ನು estimate ಎಂದು ಗುರುತಿಸಲಾಗುತ್ತದೆ. ಈಗ ${records.length}ರಲ್ಲಿ ${realCount} ದಾಖಲೆಗಳು Sentinel-2. ಹೀಟ್‌ಮ್ಯಾಪ್ ಅಂದಾಜು ಪಿಕ್ಸೆಲ್‌ಗಳನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.`;
  }
  if (words.help.test(text)) {
    return isHindi
      ? "Drishti में Home पर कार्यक्षेत्र, Map पर जलागम और हीटमैप, Monitoring पर छह पर्यावरणीय सूचकांक, Upload पर फील्ड ऑडिट, Offline vault में स्थानीय रिकॉर्ड और About में प्लेटफ़ॉर्म परिचय मिलता है। मैं अभी लोड किए गए डेटा को भी समझा सकता हूँ।"
      : "Drishti ನಲ್ಲಿ Home ಕಾರ್ಯಕ್ಷೇತ್ರ, Map ಜಲಾನಯನ ಮತ್ತು ಹೀಟ್‌ಮ್ಯಾಪ್, Monitoring ಆರು ಪರಿಸರ ಸೂಚ್ಯಂಕಗಳು, Upload ಕ್ಷೇತ್ರ ಆಡಿಟ್, Offline vault ಸ್ಥಳೀಯ ದಾಖಲೆಗಳು ಮತ್ತು About ವೇದಿಕೆಯ ಪರಿಚಯವನ್ನು ಒದಗಿಸುತ್ತದೆ. ಲೋಡ್ ಆಗಿರುವ ಡೇಟಾವನ್ನೂ ವಿವರಿಸಬಹುದು.";
  }
  if (words.latest.test(text)) {
    const records = context.auditSummary?.indices ?? [];
    const latest = records.at(-1);
    if (!latest) {
      return isHindi
        ? "अभी कोई वार्षिक सूचकांक डेटा लोड नहीं है। मानचित्र में जलागम चुनें या Monitoring खोलकर डेटा आने तक प्रतीक्षा करें।"
        : "ಇನ್ನೂ ವಾರ್ಷಿಕ ಸೂಚ್ಯಂಕ ಡೇಟಾ ಲೋಡ್ ಆಗಿಲ್ಲ. ನಕ್ಷೆಯಲ್ಲಿ ಜಲಾನಯನ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ Monitoring ತೆರೆಯಿರಿ.";
    }
    const items = ["ndvi", "ndwi", "smi", "ndti", "evi", "bsi"]
      .map((key) => Number.isFinite(latest[key]) ? `${key.toUpperCase()} ${latest[key].toFixed(3)} — ${LOCALIZED_INDEX_NAMES[language][key]}: ${localizedInterpretation(key, latest[key], language)}` : null)
      .filter(Boolean);
    const observationCount = records.filter((record) => record.source === "sentinel-2").length;
    return isHindi
      ? `${context.auditSummary.watershed_name ?? "चयनित क्षेत्र"} के लिए नवीनतम वार्षिक डेटा ${latest.year} का है:\n\n${items.join("\n")}\n\n${records.length} में से ${observationCount} वर्ष Sentinel-2 पिक्सेल अवलोकन हैं। यह स्क्रीनिंग डेटा है, जमीनी माप नहीं। स्रोत लेबल, मौसम और स्थानीय निरीक्षण के साथ इसकी तुलना करें।`
      : `${context.auditSummary.watershed_name ?? "ಆಯ್ದ ಪ್ರದೇಶ"}ದ ಇತ್ತೀಚಿನ ವಾರ್ಷಿಕ ಡೇಟಾ ${latest.year}ರದು:\n\n${items.join("\n")}\n\n${records.length}ರಲ್ಲಿ ${observationCount} ವರ್ಷಗಳು Sentinel-2 ಪಿಕ್ಸೆಲ್ ವೀಕ್ಷಣೆಗಳು. ಇವು ಪರಿಶೀಲನಾ ಸೂಚನೆಗಳು ಮಾತ್ರ; ಕ್ಷೇತ್ರದ ಅಳತೆಗಳಲ್ಲ. ಮೂಲ ಲೇಬಲ್, ಋತು ಮತ್ತು ಸ್ಥಳೀಯ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಹೋಲಿಸಿ.`;
  }
  if (words.map.test(text)) {
    return isHindi
      ? `Map में जलागम चुनें या मानचित्र पर क्लिक/मार्कर खींचकर स्थान चुनें। वर्तमान निर्देशांक ${context.coords.latitude.toFixed(5)}° N, ${context.coords.longitude.toFixed(5)}° E हैं।`
      : `Map ನಲ್ಲಿ ಜಲಾನಯನ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ/ಮಾರ್ಕರ್ ಎಳೆಯುವ ಮೂಲಕ ಸ್ಥಳ ನಿಗದಿಪಡಿಸಿ. ಈಗಿನ ನಿರ್ದೇಶಾಂಕಗಳು ${context.coords.latitude.toFixed(5)}° N, ${context.coords.longitude.toFixed(5)}° E.`;
  }
  const inferredIndex = words.water.test(text) ? "ndwi"
    : words.vegetation.test(text) ? "ndvi"
      : words.moisture.test(text) ? "smi"
        : words.sediment.test(text) ? "ndti" : null;
  if (inferredIndex) return localizedIndexReply(inferredIndex, context.auditSummary, language);
  return isHindi
    ? "मैं मानचित्र, हीटमैप, NDVI/NDWI/SMI/NDTI/BSI/EVI, उपग्रह डेटा स्रोत, फील्ड फोटो ऑडिट और ऑफ़लाइन रिकॉर्ड समझा सकता हूँ। सूचकांक के लिए उसका नाम, जैसे NDVI, पूछें।"
    : "ನಕ್ಷೆ, ಹೀಟ್‌ಮ್ಯಾಪ್, NDVI/NDWI/SMI/NDTI/BSI/EVI, ಉಪಗ್ರಹ ಡೇಟಾ ಮೂಲ, ಕ್ಷೇತ್ರ ಫೋಟೋ ಆಡಿಟ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ದಾಖಲೆಗಳನ್ನು ವಿವರಿಸಬಹುದು. ಸೂಚ್ಯಂಕದ ಬಗ್ಗೆ ಕೇಳಲು ಅದರ ಹೆಸರು, ಉದಾ. NDVI, ನಮೂದಿಸಿ.";
}

function latestDataReply(summary) {
  const records = summary?.indices ?? [];
  const latest = records.at(-1);
  if (!latest) {
    return "I don’t have an index time series loaded yet. Open Monitoring or choose a watershed on the Map, then ask me again once the observations finish loading.";
  }

  const dataYear = latest.year;
  const source =
    latest.source === "sentinel-2"
      ? "This latest record is labelled Sentinel-2."
      : latest.source
        ? `This latest record is labelled “${latest.source}”, so it is an estimate rather than a Sentinel-2 pixel observation.`
        : summary.category
          ? `The monitoring series is labelled “${summary.category}”. Check per-year source labels in Monitoring for this record.`
          : "The source is not labelled in this record; check the source information in Monitoring.";
  const highlights = ["ndvi", "ndwi", "smi", "ndti", "bsi", "evi"].map((key) => {
    const value = latest[key];
    if (!Number.isFinite(value)) return null;
    return `${key.toUpperCase()} ${value.toFixed(3)} — ${INDEX_GUIDE[key].interpret(value)}`;
  }).filter(Boolean);
  const trendStart = records[0];
  const trendText =
    trendStart && records.length > 1
      ? `Across the displayed ${trendStart.year}–${dataYear} series, NDVI changed from ${trendStart.ndvi.toFixed(3)} to ${latest.ndvi.toFixed(3)} (${(latest.ndvi - trendStart.ndvi >= 0 ? "+" : "")}${(latest.ndvi - trendStart.ndvi).toFixed(3)}).`
      : "";

  return [
    `For ${summary.watershed_name ?? "the selected study area"}, the latest annual record is ${dataYear}.`,
    ...highlights,
    source,
    trendText,
    "These are screening indicators. Compare the imagery, source labels, season, and field observations before making decisions.",
  ].filter(Boolean).join("\n\n");
}

function indexReply(indexKey, summary) {
  const guide = INDEX_GUIDE[indexKey];
  const records = summary?.indices ?? [];
  const latest = records.at(-1);
  const value = latest?.[indexKey];
  if (!Number.isFinite(value)) {
    return `${indexKey.toUpperCase()} is ${guide.label}. ${guide.explanation} I don’t have a current ${indexKey.toUpperCase()} value loaded yet; check Monitoring after the data finishes loading.`;
  }
  const recordSource =
    latest.source === "sentinel-2"
      ? "The latest record is labelled Sentinel-2."
      : latest.source
        ? `The latest record is labelled “${latest.source}” (an estimate, not a Sentinel-2 observation).`
        : summary?.category
          ? `The monitoring series is labelled “${summary.category}”; check per-year source labels on Monitoring.`
          : "Check the source labels on the Monitoring page.";
  return `${indexKey.toUpperCase()} (${guide.label}) is ${value.toFixed(3)} for ${latest.year}. ${guide.interpret(value)}\n\n${guide.explanation}\n\n${recordSource} Values are indicators, not standalone field measurements.`;
}

function mapReply(coords, heatmapSummary) {
  const summaryMatchesLocation =
    heatmapSummary &&
    heatmapSummary.latitude === coords.latitude &&
    heatmapSummary.longitude === coords.longitude;
  const liveSummary = summaryMatchesLocation
    ? `\n\nThe current ${heatmapSummary.index.toUpperCase()} heatmap (${heatmapSummary.year}) has ${heatmapSummary.validPixels} valid pixels. The area average is ${heatmapSummary.mean.toFixed(3)}, with a range of ${heatmapSummary.min.toFixed(3)} to ${heatmapSummary.max.toFixed(3)}. The nearest sampled pixel is ${heatmapSummary.nearestValue?.toFixed(3) ?? "unavailable"}${heatmapSummary.nearestDistance === null ? "" : `, about ${heatmapSummary.nearestDistance} m from the selected point`}. Its indicative bands contain ${heatmapSummary.classes.low} low, ${heatmapSummary.classes.medium} moderate, and ${heatmapSummary.classes.high} high pixels.`
    : "Once the selected location’s heatmap has loaded, its nearest pixel, area average, range, and low/moderate/high pixel counts are shown below the map.";
  return `The Map lets you choose a saved watershed or click/drag the marker to set a custom study point. The current point is ${coords.latitude.toFixed(5)}° N, ${coords.longitude.toFixed(5)}° E. Select an index and year above the map; sampled Sentinel-2 pixels appear as a colour grid when zoomed in. The panel below the map reports the nearest valid pixel, area average, observed range, and low/moderate/high pixel counts. “High” means a high value for that index, not always a positive condition. ${liveSummary}`;
}

function answerQuestion(question, context, language = "en") {
  if (language !== "en") {
    return localizedAnswerQuestion(question, context, language);
  }
  const text = question.toLowerCase();

  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(text)) {
    return `Hello! I can explain Drishti’s map, satellite indices, field audits, offline vault, or the current readings. You’re on ${TAB_NAMES[context.activeTab] ?? "the site"}. What would you like to understand?`;
  }
  if (/tour|beginner|getting started|how do i start/.test(text)) {
    context.onStartTour();
    return "The tour is open. It explains the map, satellite readings, field photos, and offline records.";
  }
  if (/what can you|what do you know|help|features|what does this site|about (geo)?drishti/.test(text)) {
    return "Drishti lets you:\n\n• Choose a watershed and inspect its map.\n• Compare yearly NDVI, NDWI, SMI, NDTI, EVI, and BSI readings.\n• Photograph an asset and submit an audit when online.\n• Save audit records on this device and sync them later.\n\nAsk me about an index or the data currently shown.";
  }
  if (/heat.?map|heat map|colour|color|red|green|yellow|pixel|range|low|medium|moderate|high/.test(text) && /map|heat|colour|color|pixel|low|medium|moderate|high|red|green|yellow/.test(text)) {
    return mapReply(context.coords, context.heatmapSummary);
  }
  const indexMatch = text.match(/\b(ndvi|ndwi|smi|ndti|bsi|evi)\b/);
  if (indexMatch) {
    return indexReply(indexMatch[1], context.auditSummary);
  }
  if (/upload|photo|camera|field audit|audit certificate|capture/.test(text)) {
    return "Open Upload to capture or review a field-asset photo. Allow camera access when prompted, then capture or retake the image. When online, Generate field audit submits it for analysis and a certificate; when offline, the record is saved in this browser’s Offline vault to sync later. Review the photo and location before submitting.";
  }
  if (/offline|vault|sync|saved record/.test(text)) {
    return `The Offline vault stores unsynced audit records locally in this browser. There are ${context.pendingCount} pending record${context.pendingCount === 1 ? "" : "s"} right now. When connected, you can review and sync them from the vault; syncing uploads the saved audits.`;
  }
  if (/source|sentinel|estimate|estimated|real data|satellite data/.test(text)) {
    const records = context.auditSummary?.indices ?? [];
    const realCount = records.filter((record) => record.source === "sentinel-2").length;
    const estimatedCount = records.filter(
      (record) => record.source && record.source !== "sentinel-2",
    ).length;
    return `Monitoring labels records as Sentinel-2 when real satellite pixels were read, and labels coordinate-derived or fallback values as estimates. In the currently loaded series, ${realCount} of ${records.length} records are labelled Sentinel-2 and ${estimatedCount} are labelled estimates. Heatmap colours are drawn only from valid sampled Sentinel-2 pixels; the map reports an error instead of inventing pixel data.`;
  }
  if (/monitor|trend|year|annual|index|indices|data|reading|value|interpret/.test(text)) {
    return latestDataReply(context.auditSummary);
  }
  if (/map|location|coordinate|watershed|basin|where am i/.test(text)) {
    return mapReply(context.coords, context.heatmapSummary);
  }
  if (/water/.test(text)) {
    return indexReply("ndwi", context.auditSummary);
  }
  if (/vegetation|green|plant/.test(text)) {
    return indexReply("ndvi", context.auditSummary);
  }
  if (/moisture|soil water/.test(text)) {
    return indexReply("smi", context.auditSummary);
  }
  if (/turbidity|sediment|silt/.test(text)) {
    return indexReply("ndti", context.auditSummary);
  }
  if (/bare soil|exposed soil|erosion/.test(text)) {
    return indexReply("bsi", context.auditSummary);
  }
  if (/evi|canopy/.test(text)) {
    return indexReply("evi", context.auditSummary);
  }
  return "I can help with the Map and heatmap, interpreting NDVI/NDWI/SMI/NDTI/BSI/EVI, satellite data sources, field-photo audits, and the offline vault. Try asking “What does my latest NDVI mean?” or “How do I save an audit offline?”";
}

export default function GeoDrishtiAssistant({
  activeTab,
  auditSummary,
  heatmapSummary,
  coords,
  isOnline,
  pendingCount,
  onNavigate,
  onStartTour,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about the map, an index, or your saved records.",
    },
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const sendQuestion = (value = question) => {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion) return;
    const answer = answerQuestion(trimmedQuestion, {
      activeTab,
      auditSummary,
      heatmapSummary,
      coords,
      isOnline,
      pendingCount,
      onNavigate,
      onStartTour,
    }, language === "en" ? "en" : language);
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmedQuestion },
      { role: "assistant", text: answer },
    ]);
    setQuestion("");
  };
  const chatText = CHAT_LANGUAGES[language];
  const assistantMessages = messages.map((message, index) =>
    index === 0 && message.role === "assistant"
      ? { ...message, text: chatText.welcome }
      : message,
  );

  return (
    <div className="geo-assistant">
      {isOpen && (
        <section
          className="geo-chat-panel"
          aria-label="Drishti help chat"
          aria-live="polite"
        >
          <header className="geo-chat-header">
            <span className="geo-chat-avatar"><Bot size={19} /></span>
            <span className="geo-chat-heading">
              <strong>{chatText.guide}</strong>
              <small><i className={isOnline ? "is-connected" : ""} /> {isOnline ? chatText.here : chatText.offline}</small>
            </span>
            <label className="geo-chat-language">
              <span className="sr-only">Chat language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Chat language">
                {Object.entries(CHAT_LANGUAGES).map(([code, item]) => (
                  <option key={code} value={code}>{item.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="geo-chat-icon-button"
              aria-label={chatText.close}
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown size={19} />
            </button>
          </header>
          <div className="geo-chat-messages" role="log" aria-label={chatText.conversation}>
            {assistantMessages.map((message, index) => (
              <article className={`geo-chat-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.role === "assistant" && <Sparkles size={13} />}
                <p>{message.text}</p>
              </article>
            ))}
            {messages.length === 1 && (
              <div className="geo-chat-prompts">
                {chatText.prompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendQuestion(prompt)}>
                    {prompt}<ArrowRight size={12} />
                  </button>
                ))}
              </div>
            )}
            {messages.length > 1 && (
              <div className="geo-chat-shortcuts" aria-label="Open a site section">
                <button type="button" onClick={() => onNavigate("map")}><MapPinned size={12} /> {chatText.map}</button>
                <button type="button" onClick={() => onNavigate("monitoring")}><ChartNoAxesCombined size={12} /> {chatText.monitoring}</button>
                <button type="button" onClick={onStartTour}><CircleHelp size={12} /> {chatText.tour}</button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            className="geo-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendQuestion();
            }}
          >
            <input
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={chatText.placeholder}
              aria-label={chatText.input}
              maxLength={500}
            />
            <button type="submit" aria-label={chatText.send} disabled={!question.trim()}>
              <Send size={16} />
            </button>
          </form>
          <p className="geo-chat-disclaimer">{chatText.disclaimer}</p>
        </section>
      )}
      <button
        type="button"
        className={`geo-assistant-launcher ${isOpen ? "is-open" : ""}`}
        aria-label={isOpen ? "Close Drishti guide" : "Chat with the Drishti guide"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={21} /> : <><MessageCircle size={20} /><span>Ask Drishti</span></>}
      </button>
    </div>
  );
}
