import TokenCalculator from "./TokenCalculator";

export const metadata = {
  title: "AI Token Calculator: Count Tokens & Estimate LLM Cost",
  description:
    "Free AI token calculator. Paste a prompt to estimate tokens and compare cost per request and per month across OpenAI, Anthropic and Google models.",
  alternates: { canonical: "/ai-token-calculator" },
};

export default function Page() {
  return <TokenCalculator />;
}
