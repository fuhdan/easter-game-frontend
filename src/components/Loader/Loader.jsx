import React from "react";
//import "./Loader.css"; // optional if you want separate styles, otherwise use App.css

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="loading">
      <div className="ypsomed-logo">
        <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default Loader;
