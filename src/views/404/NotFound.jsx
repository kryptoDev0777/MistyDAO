import MistyIcon from "../../assets/icons/mama-nav-header.svg";
import "./notfound.scss";

export default function NotFound() {
  return (
    <div id="not-found">
      <div className="not-found-header">
        <a href="https://mistydao.com" target="_blank">
          <img className="branding-header-icon" src={MistyIcon} alt="MISTYDAO" />
        </a>

        <h2 style={{ textAlign: "center" }}>Page not found</h2>
      </div>
    </div>
  );
}
