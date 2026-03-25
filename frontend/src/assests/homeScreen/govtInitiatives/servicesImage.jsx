import React from 'react';
const Serviceimage = (props) =>{
    let inverted = props.inverted
    return(
        <svg xmlns="http://www.w3.org/2000/svg" width={props.width}  height="150" viewBox="0 0 267.4 397.012">
        <g id="Group_1100" data-name="Group 1100" transform="translate(11038.381 -17083.359)">
          <rect id="Rectangle_1132" data-name="Rectangle 1132" width="267.4" height="377.06" transform="translate(-11038.381 17083.359)" fill={props.color}/>
          <rect id="BottomLabelCard" width="267.4" height="149.5" transform="translate(-11038.381 17330.871)"  fill={inverted ? props.color : "#fff"} stroke={inverted ? '#707070' : '#fff'}/>
          <path id="Path_40450" data-name="Path 40450" d="M315.43,724.03l42.63-28.71,43.49-28.52-86.12.19-86.13-.19,43.49,28.52Z" transform="translate(-11220.11 16625.781)" fill={ props.color} stroke={props.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" fillRule="evenodd"/>
          <path id="Label" d={props.label} fill={props.textColor} fillRule="evenodd"/>
          <path id="BottomLabel" d={props.bottomlabel} fill="#6f6f6e" fillRule="evenodd"/>
          <path id="Path_40453" data-name="Path 40453" d="M325.27,809.5q-3.72,4.41-7.03,8.93-1.23,1.665-2.34,3.27c-.74,1.07-1.5,2.21-2.29,3.43s-1.53,2.39-2.23,3.54a2.2,2.2,0,0,1-1.61.48c-1.31-.05-2.02-.28-2.13-.7-.5-1.23-.91-2.25-1.2-3.08a14.2,14.2,0,0,1-.56-1.75,5.23,5.23,0,0,1-.11-1.03,1.868,1.868,0,0,1,1.07-1.6,3.854,3.854,0,0,1,1.87-.64.963.963,0,0,1,.83.52,8.085,8.085,0,0,1,.7,1.53,7.958,7.958,0,0,0,.51,1.2q3.3-4.92,5.83-8.54a41.75,41.75,0,0,1,3.19-4.25,6.328,6.328,0,0,1,5.29-2.22l.22.9Z" transform="translate(-11220.11 16625.781)" fill={props.color} fillRule="evenodd"/>
        </g>
      </svg>
    )
}
  export default Serviceimage; 