import styles from "./video.module.css";

export default function BackgroundVideo() {
    return (
        <video
          className="backgroundVideo"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
    );
  }