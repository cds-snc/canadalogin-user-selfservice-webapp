import { GcdsContainer, GcdsHeading } from "@cdssnc/gcds-components-react";

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
