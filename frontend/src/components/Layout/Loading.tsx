import { GcdsContainer, GcdsHeading } from "@gcds-core/components-react";

interface LoaderProps {
  text: string;
}

export default function Loader({ text }: LoaderProps) {
  return (
    <>
      <GcdsContainer className="page-loader">
        <div className="loader-fixed-position">
          <GcdsHeading tag="h1">{text}</GcdsHeading>
        </div>
      </GcdsContainer>
    </>
  );
}
