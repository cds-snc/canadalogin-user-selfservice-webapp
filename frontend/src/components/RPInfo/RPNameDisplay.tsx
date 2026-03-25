import { GcdsText } from "@gcds-core/components-react";
import { useUser } from "../Providers/useUser";

interface RPNameDisplayProps {
  rpName: string;
}

export default function RPNameDisplay({ rpName }: RPNameDisplayProps) {
  const { state } = useUser();

  const rp = state?.relyingPartyInfo
    ? {
        name: state.relyingPartyInfo.linkName,
        url: state.relyingPartyInfo.url,
      }
    : null;

  return <GcdsText>{rp?.name ?? rpName}</GcdsText>;
}
