import JsonFormatterClient from "./JsonFormatterClient";

export const metadata = {
  title: "JSON Formatter & Validator – Free Online Tool",
  description:
    "Free JSON formatter and validator. Paste messy or minified JSON to format it, find errors with line numbers, and generate a JSON Schema in your browser.",
  alternates: { canonical: "/json-formatter" },
};

export default function JsonFormatterPage() {
  return <JsonFormatterClient />;
}
