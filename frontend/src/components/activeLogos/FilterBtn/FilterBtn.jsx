import "./FilterBtn.css";

export default function FilterBtn({isOpen=false, className=""}) {



  return (
    <div className={`filterBtn ${className} ${isOpen? "filterBtn--open" : ""}`}>
      <span className="a"></span>
      <span className="b"></span>
      <span className="c"></span>
    </div>
  )
}