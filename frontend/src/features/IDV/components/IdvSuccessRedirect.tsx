import { Navigate, useParams } from "react-router";

export default function IdvSuccessRedirect() {
  const { language } = useParams();

  return (
    <Navigate
      to={`/${language ?? "en"}/profile`}
      replace
      state={{ showIDVSuccessNotice: true }}
    />
  );
}
