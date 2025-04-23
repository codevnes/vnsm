import { notFoundMetadata } from "./not-found-metadata";
import NotFoundPage from "./not-found";

export const metadata = notFoundMetadata;

export default function Custom404() {
  return <NotFoundPage />;
}