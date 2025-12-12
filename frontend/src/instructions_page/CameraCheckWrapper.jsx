import { useParams } from "react-router-dom";
import CameraCheck from "../components/CameraCheck";

export default function CameraCheckWrapper() {
  const { questionSetId } = useParams();

  return <CameraCheck questionSetId={questionSetId} />;
}
