import React from "react";
import { Line } from "react-chartjs-2";
function LineChart(props) {
  return (
    <div className="chart-container">
      <Line
        data={props.chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: props.labelText
            },
            legend: {
              display: false
            }
          }
        }}
        style={{
          border: '1px solid black',
          width: '35vw',
          backgroundColor:'white'
        }}
      />
    </div>
  );
}
export default LineChart;