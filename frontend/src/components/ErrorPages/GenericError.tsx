import ErrorPage from "./ErrorPage";

export default function GenericError() {
  return (
    <ErrorPage
      title="Something went wrong"
      text="Sorry about that. Try one of the following options:"
      primaryButtonName="Manage CanadaLogin"
      primaryButtonLink="/"
      secondaryButtonName="Sign out"
      secondaryButtonLink="/"
    />
  );
}