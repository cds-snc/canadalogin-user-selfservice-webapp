import ErrorPage from "./ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      title="Page Not Found"
      text="The page you are looking for does not exist."
      primaryButtonName="Go Back"
      primaryButtonLink="/"
      secondaryButtonName="Managed CanadaLogin"
      secondaryButtonLink="/"
    />
  );
}