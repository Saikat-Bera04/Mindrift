export interface Helpline {
  name: string;
  number: string;
  category: "suicide" | "anxiety" | "student" | "general";
  description: string;
  hours: string;
  region: string;
}

export const HELPLINES: Helpline[] = [
  {
    name: "NIMHANS",
    number: "080-46110007",
    category: "general",
    description: "National Institute of Mental Health and Neurosciences helpline.",
    hours: "24/7",
    region: "National (India)"
  },
  {
    name: "Vandrevala Foundation",
    number: "9999666555",
    category: "suicide",
    description: "Crisis intervention and suicide prevention.",
    hours: "24/7",
    region: "National (India)"
  },
  {
    name: "iCall (TISS)",
    number: "9152987821",
    category: "general",
    description: "Professional counseling service by Tata Institute of Social Sciences.",
    hours: "8 AM - 10 PM",
    region: "National (India)"
  },
  {
    name: "Sumaitri",
    number: "011-23389090",
    category: "suicide",
    description: "Crisis intervention for people in distress.",
    hours: "2 PM - 10 PM",
    region: "Delhi / National"
  },
  {
    name: "Sneha India",
    number: "044-24640050",
    category: "suicide",
    description: "Suicide prevention and emotional support.",
    hours: "24/7",
    region: "Chennai / National"
  },
  {
    name: "Aasra",
    number: "9820466726",
    category: "suicide",
    description: "Crisis intervention and suicide prevention center.",
    hours: "24/7",
    region: "Navi Mumbai / National"
  },
  {
    name: "Parivarthan",
    number: "7676602602",
    category: "general",
    description: "Counseling and training services for mental health.",
    hours: "1 PM - 10 PM",
    region: "Bangalore / National"
  }
];
