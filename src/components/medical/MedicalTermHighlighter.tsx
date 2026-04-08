import { useMemo } from "react";
import { MEDICAL_TERMS } from "@/lib/medicalTerms";
import { useMedicalTerm } from "@/contexts/MedicalTermContext";
import { cleanLatex } from "@/lib/cleanLatex";

interface Props {
  text: string;
  className?: string;
}

// Build regex once — terms already sorted longest-first
const termsPattern = MEDICAL_TERMS.map(t =>
  t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");
const TERMS_REGEX = new RegExp(`\\b(${termsPattern})\\b`, "gi");

interface Segment {
  text: string;
  isTerm: boolean;
}

function segmentText(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  TERMS_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TERMS_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isTerm: false });
    }
    segments.push({ text: match[0], isTerm: true });
    lastIndex = TERMS_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isTerm: false });
  }

  return segments;
}

const MedicalTermHighlighter = ({ text, className }: Props) => {
  const { openTerm } = useMedicalTerm();

  const segments = useMemo(() => segmentText(text), [text]);

  if (segments.length <= 1 && !segments[0]?.isTerm) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.isTerm ? (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); openTerm(seg.text); }}
            className="border-b border-dotted border-primary/50 text-primary cursor-pointer hover:border-primary hover:text-primary/80 transition-colors"
            title="Clique para ver definição"
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
};

export default MedicalTermHighlighter;
