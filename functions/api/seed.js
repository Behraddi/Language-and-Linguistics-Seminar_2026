import { authenticate, json, cors } from './_helpers.js';

const INITIAL_EVENTS = [
  {
    date: "2024-05-03", time: "16:00", endTime: "17:00",
    speaker: "Dr Alex Luke", institution: "University of Sydney",
    title: "'SMART Goals' and 'HR Language': Technologised Literacy Practices and Counter-Conduct in the Workplace",
    abstract: "This presentation will examine the use of discourse and literacy practices in a performance management system to produce reflective practitioners, and how these practices were resisted by a counter-language ideology. The research project will draw on employed linguistic ethnographic methods, using interactional data, interviews, field notes, and documentation to research technologised literacy practices. These practices were a form of technologisation of discourse in the workplace and were usually forms of writing connected to the performance management system that worked to also position reviewees as reflective practitioners. However, running parallel with these was a counter-language ideology that variously portrayed these practices as HR language, KPI language or managese. Implications for workplace discourse, the interplay between institutional and professional discourses, and the relationship between class and discourse practices will be explored.",
    venue: "Parramatta South Campus, EB.3.36", zoomLink: ""
  },
  {
    date: "2024-05-17", time: "16:00", endTime: "17:00",
    speaker: "Ms. Marianne Haugaard Skov", institution: "The University of Copenhagen",
    title: "English As A Meaning-Making Resource Among Young Danes",
    abstract: "This presentation introduces the PhD project English as a meaning-making resource among young Danes. The project is part of the larger research project English and Globalisation in Denmark and investigates how and with what symbolic value English is used among young Danes today. Through a linguistic ethnographic case study among a group of young Danish high school students (15–17 years old) the project tries to uncover the role of English in the everyday lives of young Danes. A special focus of the project is given to the role that social media platforms like TikTok play in this. In this presentation, you will be introduced to the study's methodological approach, theoretical foundation, and some of the preliminary findings. You will hear about the language ideological tensions about English that come with the many different roles English plays for young Danes today.",
    venue: "Parramatta South Campus, EB.3.36", zoomLink: ""
  },
  {
    date: "2024-05-31", time: "16:00", endTime: "17:00",
    speaker: "Dr Behnam Soltani", institution: "Singapore Institute of Technology",
    title: "Implementing Feedback Literacy Practices through Self-Assessment and Peer Feedback: A Language Socialization Perspective",
    abstract: "In this talk, I will discuss the storied life of an international student named Max, who embarked on undergraduate studies in a New Zealand tertiary institution. I look at the key concepts of feedback literacy, self-assessment, and peer feedback alongside his language socialization process. Drawing on narrative frames and interview data, I discuss how he was socialized and how he socialized himself into feedback literacy practices in an English for Academic Purposes (EAP) classroom.",
    venue: "Online via Zoom", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-06-14", time: "13:00", endTime: "14:00",
    speaker: "Ms. Huong Ho", institution: "Western Sydney University",
    title: "Vietnamese Passives from the Perspective of Lexical Mapping Theory",
    abstract: "Cross-linguistically, the passive is a discourse-pragmatically driven structure that reduces the prominence of the agent and shifts focus to another participant in the event. In this presentation, I will discuss the cognitively demanding nature of passives across languages and propose the morphosyntactic realization of Vietnamese passives based on Lexical Mapping Theory within Lexical Functional Grammar (Bresnan et al., 2016). This presentation is part of my PhD project, which is among the first studies to analyze the syntax of Vietnamese, an Austroasiatic language, within the theoretical framework of Lexical Functional Grammar.",
    venue: "Parramatta South Campus, EA.2.30", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-07-12", time: "13:00", endTime: "14:00",
    speaker: "Associate Prof. Satomi Kawaguchi", institution: "Western Sydney University",
    title: "Dative Constructions and Passivisation in Japanese L1 and Chinese L1 Learners of English",
    abstract: "This study tests the lexical mapping hypothesis (LMH) within Processability Theory (Pienemann, 1998) with special reference to dative constructions in English L2. The LMH hypothesises that L2 learners develop their mapping of thematic arguments to grammatical functions proceeding from 'default mapping' to 'default mapping plus additional argument' and then to 'non-default mapping'. Results support the hypothesis since Japanese L1 and Chinese L1 learners mainly produced prepositional datives.",
    venue: "Online via Zoom", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-07-26", time: "13:00", endTime: "14:00",
    speaker: "Dr Ang Pei Soo", institution: "The University of Malaya",
    title: "Perspectivizing Experiences of Dementia",
    abstract: "This presentation highlights how images of dementia published in the Malaysian public domain communicate about experiences of dementia. The study employed the Visual Discourses of Disability framework (ViDD) - a visual framework that combines perspectives of critical social semiotics and disability studies. Findings from the visual analysis of 432 images were also corroborated in a group interview with representatives of Alzheimer's Disease Foundation Malaysia.",
    venue: "Online via Zoom", zoomLink: ""
  },
  {
    date: "2024-08-09", time: "13:00", endTime: "14:00",
    speaker: "Dr Amir Sheikhan", institution: "The University of Queensland",
    title: "Responding to Conversational Humour in Intercultural Initial Interaction: The Role of Epistemics and Affiliation",
    abstract: "In this talk, I present a framework for studying humour in its interactive context, a model that focuses on the sequential trajectory of humour in interaction. The data draws from the Corpus of Video-Mediated English as a Lingua Franca Conversations (ViMEF) and a further collection of video-recordings of intercultural initial interaction in English. Using the framework of interactional pragmatics, the analysis focuses on the design of humour episodes and the sequential environment in which conversational humour accomplishes.",
    venue: "Online via Zoom", zoomLink: ""
  },
  {
    date: "2024-08-23", time: "13:00", endTime: "14:00",
    speaker: "Ms. Mahasta Zare", institution: "Western Sydney University",
    title: "Socio-Cultural Factors Influencing Persian Speakers' English Learning Experiences in Australia",
    abstract: "This study presents key findings on the impact of socio-cultural factors on Iranian immigrants' English as a Second Language (ESL) learning experiences in Australia. Specifically, it explores how gender, age, and educational background from Iran shape their perceptions and experiences of learning English. The study, a qualitative investigation involving 24 adult Persian speakers in Australia, utilised semi-structured interviews to gather in-depth insights.",
    venue: "Online via Zoom", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-09-06", time: "13:00", endTime: "14:00",
    speaker: "Professor Sender Dovchin", institution: "Curtin University",
    title: "Translanguaging as Ordinary: Rethinking Bi/Multilingual Practices",
    abstract: "This presentation is based on the premise that the analytic potential of bi/multilingual studies can be enhanced through a stronger focus on translanguaging as a reflective of everyday, mundane, and ordinary occurrences rather than of exotic, eccentric or unconventional ones. Translanguaging is neither to celebrate nor to deplore but something to observe and examine with interest like anything else.",
    venue: "Online via Zoom", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-09-20", time: "13:00", endTime: "14:00",
    speaker: "Professor Louise Ravelli", institution: "University of New South Wales",
    title: "Museum Communication in the 21st Century: Transforming Practice",
    abstract: "Museums are fundamentally meaning-making entities which communicate through a diverse range of modes and resources, from the nature of what is collected and displayed, to the labels in exhibitions, to the very design of museums themselves. This paper examines how the design of an exhibition can manifest positive changes in the social practices of museums, drawing on examples from culturally-diverse museums.",
    venue: "Parramatta South Campus, EB.3.18", zoomLink: "https://uws.zoom.us/j/86544007750?pwd=ZGNjdTlqZXpsMHZ5alprMnZza1JxQT09"
  },
  {
    date: "2024-10-04", time: "13:00", endTime: "14:00",
    speaker: "Mr Josh Honeyman", institution: "Western Sydney University",
    title: "Conceptual Disruption Within Creativity",
    abstract: "This presentation will examine how technology disrupts image making and visual communication. It will touch on the concepts of disruptive technologies, innovative disruption, social disruption, and conceptual disruption. These concepts will be explored through existing literature and by examining AI image generators as a disruptive technology impacting handmade paintings.",
    venue: "TBA", zoomLink: ""
  },
  {
    date: "2024-10-18", time: "13:00", endTime: "14:00",
    speaker: "Dr Laura Smith-Khan", institution: "University of New England",
    title: "Intercultural and Professional Communication in Migration Law Education",
    abstract: "This presentation shares findings from a digital ethnography of the Graduate Diploma in Migration Law and Practice, the qualification required for non-lawyers to be authorized to offer professional migration advice and assistance in Australia. It explores the production and navigation of (mis)understanding through an examination of simulated migration law consultations.",
    venue: "Online via Zoom", zoomLink: ""
  },
  {
    date: "2025-03-07", time: "13:00", endTime: "14:00",
    speaker: "Prof. Felicity Meakins", institution: "University of Queensland",
    title: "Micro to Macro: Modelling Language Variation Across Time",
    abstract: "", abstractPdf: "Abstracts/Prof. Felicity Meakins_Abstract.pdf",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-03-21", time: "13:00", endTime: "14:00",
    speaker: "Dr Howard Manns, Prof. Kate Burridge, Dr. Simon Musgrave", institution: "Monash University",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-04-04", time: "13:00", endTime: "14:00",
    speaker: "Dr Andrew Ross", institution: "University of Canberra",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-04-18", time: "13:00", endTime: "14:00",
    speaker: "Dr Andy Jocuns", institution: "Wenzhou-Kean University, Wenzhou, China",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-05-02", time: "13:00", endTime: "14:00",
    speaker: "A/P Fei Victor Lim", institution: "Nanyang Technological University, Singapore",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-05-16", time: "13:00", endTime: "14:00",
    speaker: "A/P Anne Schluter", institution: "The Hong Kong Polytechnic University",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-05-30", time: "13:00", endTime: "14:00",
    speaker: "Prof. Stephen May", institution: "University of Auckland",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-07-25", time: "13:00", endTime: "14:00",
    speaker: "A/P Scott Barnes", institution: "Macquarie University",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-08-08", time: "13:00", endTime: "14:00",
    speaker: "A/P Amanda Baker", institution: "University of Wollongong",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-08-22", time: "13:00", endTime: "14:00",
    speaker: "Dr Alex Luke", institution: "University of Sydney",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-09-05", time: "13:00", endTime: "14:00",
    speaker: "Dr Gerald Roche, Dr Jessica Kruk", institution: "University of La Trobe, University of Western Sydney",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-09-19", time: "13:00", endTime: "14:00",
    speaker: "Dr Alexandra Grey", institution: "UTS",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-10-03", time: "13:00", endTime: "14:00",
    speaker: "Dr Mahtab Janfada", institution: "University of Melbourne",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
  {
    date: "2025-10-17", time: "13:00", endTime: "14:00",
    speaker: "Dr Kurt Sengul", institution: "Macquarie University",
    title: "TBA", abstract: "",
    venue: "Via Zoom", zoomLink: ""
  },
];

export async function onRequestOptions() { return cors(); }

export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  const existing = await env.CMS_KV.get('events', 'json');
  if (existing && existing.length > 0) {
    return json({ error: 'Data already seeded. Delete existing events first.' }, 409);
  }
  const events = INITIAL_EVENTS.map(e => ({ ...e, id: crypto.randomUUID() }));
  await env.CMS_KV.put('events', JSON.stringify(events));
  return json({ success: true, count: events.length });
}
