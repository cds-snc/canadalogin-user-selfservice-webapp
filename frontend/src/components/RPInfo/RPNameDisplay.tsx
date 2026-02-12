import { GcdsText } from "@cdssnc/gcds-components-react";
import { useUser } from "../Providers/useUser";
import { ReactNode } from "react";

type RPNameDisplayProps = {
  rpName?: ReactNode;
};

export default function RPNameDisplay({ rpName }: RPNameDisplayProps) {
  const { state } = useUser();

  const rp = state?.relyingPartyInfo
    ? {
        name: state?.relyingPartyInfo?.linkName,
        url: state?.relyingPartyInfo?.url,
      }
    : null;

  return <GcdsText>{rp?.name ?? rpName}</GcdsText>;
}
