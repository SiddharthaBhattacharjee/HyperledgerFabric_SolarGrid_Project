import React, { useEffect, useState, useRef } from 'react';
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import Linechart from "./components/Linechart"
import "./App.css";
import siemensLogo from "./res/R.png";
import Loading from './components/Loading';

//@Deprecated
// const useDatabaseState = (key, defaultValue) => {
//   const [state, setState] = useState(() => {
//     // Fetch data from the database when the component mounts
//     const fetchData = async () => {
//       try {
//         const response = await fetch(`http://localhost:3002/getData?key=${key}`);
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         return data !== null ? data : defaultValue;
//       } catch (error) {
//         console.error('Failed to fetch data:', error);
//         return defaultValue;
//       }
//     };

//     // Initialize state with fetched data or default value
//     fetchData().then(fetchedData => setState(fetchedData));
//     return defaultValue; // Temporary default value until fetch completes
//   });

//   useEffect(() => {
//     // Save data to the database whenever the state changes
//     const saveData = async () => {
//       try {
//         await fetch(`http://localhost:3002/saveData`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ key, data: state }),
//         });
//       } catch (error) {
//         console.error('Failed to save data:', error);
//       }
//     };

//     if (state !== defaultValue) {
//       saveData();
//     }
//   }, [key, state, defaultValue]);

//   return [state, setState];
// };

function App() {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState([[0,0,0],[0,0,0]])
  const [Org1Gain, setOrg1Gain] = useState([0]);
  const [Org2Gain, setOrg2Gain] = useState([0]);
  const [Org1Loss, setOrg1Loss] = useState([0]);
  const [Org2Loss, setOrg2Loss] = useState([0]);
  const [Org1Record, setOrg1Record] = useState([0]);
  const [Org2Record, setOrg2Record] = useState([0]);
  //@Deprecated
  // const [data, setData] = useDatabaseState('data', [[0, 0, 0], [0, 0, 0]]);
  // const [Org1Gain, SetOrg1Gain] = useDatabaseState('Org1Gain', [0]);
  // const [Org2Gain, SetOrg2Gain] = useDatabaseState('Org2Gain', [0]);
  // const [Org1Loss, SetOrg1Loss] = useDatabaseState('Org1Loss', [0]);
  // const [Org2Loss, SetOrg2Loss] = useDatabaseState('Org2Loss', [0]);
  // const [Org1Record, SetOrg1Record] = useDatabaseState('Org1Record', [0]);
  // const [Org2Record, SetOrg2Record] = useDatabaseState('Org2Record', [0]);

  const fetchData = () => {
    window.scrollTo(0, 0);
        fetch('http://localhost:3001/getData')
          .then(response => response.json())
          .then(newData => {
            updateRecords(newData);
            console.log("Data updated");
            console.log("Data: " + newData.toString());
          });
      };

  const updateRecords = (newData) => {
    try {
        setData(newData[0]);
        setOrg1Record(newData[1]);
        setOrg1Gain(newData[2]);
        setOrg1Loss(newData[3]);
        setOrg2Record(newData[4]);
        setOrg2Gain(newData[5]);
        setOrg2Loss(newData[6]);
        setTimeout(() => {
          setLoaded(true);
        }, 3000);
    } catch (error) {
        console.error('Error updating data:', error);
    }
};




  //@Depricated
  // let updateRecords = (newData) => {
  //   SetOrg1Record(prevState => [...prevState, parseFloat(newData[0][0]).toFixed(2)]);
  //   SetOrg2Record(prevState => [...prevState, parseFloat(newData[1][0]).toFixed(2)]);
  //   if (parseFloat(newData[0][2]) === 0) {
  //     SetOrg1Gain(prevState => [...prevState, prevState[prevState.length - 1]+Math.random()*2 -1]);
  //   }
  //   else {
  //     SetOrg1Gain(prevState => [...prevState, parseFloat(newData[0][2]).toFixed(2) * -1]);
  //   }
  //   if (parseFloat(newData[0][1]) === 0) {
  //     SetOrg1Loss(prevState => [...prevState, prevState[prevState.length - 1]+Math.random()*2 -1]);
  //   }
  //   else {
  //     SetOrg1Loss(prevState => [...prevState, parseFloat(newData[0][1]).toFixed(2) * -1]);
  //   }
  //   if (parseFloat(newData[1][2]) === 0) {
  //     SetOrg2Gain(prevState => [...prevState, prevState[prevState.length - 1]+Math.random()*2 -1]);
  //   }
  //   else {
  //     SetOrg2Gain(prevState => [...prevState, parseFloat(newData[1][2]).toFixed(2) * -1]);
  //   }
  //   if (parseFloat(newData[1][1]) === 0) {
  //     SetOrg2Loss(prevState => [...prevState, prevState[prevState.length - 1]+Math.random()*2 -1]);
  //   }
  //   else {
  //     SetOrg2Loss(prevState => [...prevState, parseFloat(newData[1][1]).toFixed(2) * -1]);
  //   }
  //   setData(newData);
  // }

  // useEffect(() => {
  //   const fetchData = () => {
  //     fetch('http://localhost:3001/getData')
  //       .then(response => response.json())
  //       .then(newData => {
  //         updateRecords(newData);
  //         console.log("Data updated");
  //         console.log("Data: " + newData.toString());
  //       });
  //   };

  //   fetchData(); // Fetch data immediately

  //   const intervalId = setInterval(fetchData, 10000); // Fetch data every 10 seconds

  //   return () => clearInterval(intervalId); // Clean up on component unmount
  // }, []);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/events');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setData(data[0]);
        setOrg1Record(data[1]);
        setOrg1Gain(data[2]);
        setOrg1Loss(data[3]);
        setOrg2Record(data[4]);
        setOrg2Gain(data[5]);
        setOrg2Loss(data[6]);
    };

    return () => {
        eventSource.close();
    };
}, []);

  let Org1RecData = {
    labels: Array.from({ length: Org1Record.length }, (_, i) => i),
    datasets: [
      {
        label: "Org1 Token",
        data: Org1Record,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org2RecData = {
    labels: Array.from({ length: Org2Record.length }, (_, i) => i),
    datasets: [
      {
        label: "Org2 Token",
        data: Org2Record,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org1GainData = {
    labels: Array.from({ length: Org1Gain.length }, (_, i) => i),
    datasets: [
      {
        label: "Org1 Gain",
        data: Org1Gain,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org2GainData = {
    labels: Array.from({ length: Org2Gain.length }, (_, i) => i),
    datasets: [
      {
        label: "Org2 Gain",
        data: Org2Gain,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org1LossData = {
    labels: Array.from({ length: Org1Loss.length }, (_, i) => i),
    datasets: [
      {
        label: "Org1 Consumption",
        data: Org1Loss,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org2LossData = {
    labels: Array.from({ length: Org2Loss.length }, (_, i) => i),
    datasets: [
      {
        label: "Org2 Consumption",
        data: Org2Loss,
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        fill: true,
        borderWidth: 2
      }
    ]
  };

  let Org1Percentage = parseFloat(((Org1Record[Org1Record.length - 1] - Org1Record[Org1Record.length - 2] + Math.random()*4 -2) / (Org1Record[Org1Record.length - 1] + 1)) * 100).toFixed(2);
  let Org2Percentage = parseFloat(((Org2Record[Org2Record.length - 1] - Org2Record[Org2Record.length - 2] + Math.random()*4 -2) / (Org2Record[Org2Record.length - 1] + 1)) * 100).toFixed(2);

  if(!loaded){
    fetchData();
  }

  return (
    <div class="parent">
      <div class="navbar" style={{zIndex:9999}}>
        <div class="logoWrapper"><img src={siemensLogo} alt="Siemens Logo" class="logopng"></img><div class="logoText">Solar Grid Network Dashboard</div></div>
      </div>
      {!loaded?
      <Loading />:<></>
      }
      <div class="superWrapper">
        <div class="counterBox">
          <div class="counter">
            <p class="counterLabel">Org1 token holding</p>
            <p class="count">{data[0][0]}</p>
          </div>
          <div class="percentBox">
            <p class="percentLabel">Percentage Growth since last update</p>
            <div class="percent" style={{ color: Org1Percentage >= 0 ? 'green' : 'red' }}>
              {Org1Percentage}%
              {Org1Percentage >= 0 ? '↑' : '↓'}
            </div>
          </div>

        </div>
        <div class="counterBox">
          <div class="counter">
            <p class="counterLabel">Org2 token holding</p>
            <p class="count">{data[1][0]}</p>
          </div>
          <div class="percentBox">
            <p class="percentLabel">Percentage Growth since last update</p>
            <div class="percent" style={{ color: Org2Percentage >= 0 ? 'green' : 'red' }}>
              {Org2Percentage}%
              {Org2Percentage >= 0 ? '↑' : '↓'}
            </div>
          </div>
        </div>
      </div>
      <div class="superWrapper">
        <div class="graphWrapper"><Linechart chartData={Org1RecData} labelText={"Org1 Token Holding"}></Linechart></div>
        <div class="graphWrapper"><Linechart chartData={Org2RecData} labelText={"Org2 Token Holding"}></Linechart></div>
      </div>
      <div class="superWrapper">
        <div class="graphWrapper"><Linechart chartData={Org1GainData} labelText={"Org1 Power Generation"}></Linechart></div>
        <div class="graphWrapper"><Linechart chartData={Org2GainData} labelText={"Org2 Power Generation"}></Linechart></div>
      </div>
      <div class="superWrapper">
        <div class="graphWrapper"><Linechart chartData={Org1LossData} labelText={"Org1 Power Consumption"}></Linechart></div>
        <div class="graphWrapper"><Linechart chartData={Org2LossData} labelText={"Org2 Power Consumption"}></Linechart></div>
      </div>
    </div>
  );
}


export default App;
