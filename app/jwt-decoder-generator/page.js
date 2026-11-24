import JwtTool from "./JwtTool";

export const metadata = {
  title: "JWT Decoder & Generator: Decode and Sign Tokens Free",
  description:
    "Free JWT decoder and generator. Decode a token's header and payload, check an HS256 signature, or sign a test token. Runs in your browser.",
  alternates: { canonical: "/jwt-decoder-generator" },
};

export default function Page() {
  return <JwtTool />;
}
