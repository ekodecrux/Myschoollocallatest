import "./App.css";
import Routes from "./Routes/routes";
import { CustomTheme } from "./customTheme/Index";
import { ThemeProvider } from "@emotion/react";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import CustomSnackbar from "./customTheme/customSnackbar/CustomSnackbar";
import { fetchToken, onMessageListener } from './firebaseConfig/firebase'
import React from 'react'
import { Snackbar } from '@mui/material'
import MuiAlert from '@mui/material/Alert';
import ErrorBoundary from './components/common/ErrorBoundary';
import ChatbotWidget from './components/chatbot/ChatbotWidget';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="outlined" {...props} sx={{minWidth : 300, backgroundColor:'white'}}/>});
function App() {
  let persistor = persistStore(store);
  const [isTokenFound, setTokenFound] = React.useState(false);
  const [notification, setNotification] = React.useState({});
  const [open, setOpen] = React.useState(false);
  onMessageListener().then(payload => {
    setNotification({ title: payload.notification.title, body: payload.notification.body })
    let notifications = JSON.parse(localStorage.getItem("mySchoolNotification"))
    if (notifications === "" || notifications === undefined || notifications === null) {
      notifications = []
      notifications.push(payload)
      localStorage.setItem("mySchoolNotification", JSON.stringify(notifications))
    } else {
      notifications.push(payload)
      localStorage.setItem("mySchoolNotification", JSON.stringify(notifications))
    }
    setOpen(true)
  }).catch(err => {});
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <ThemeProvider theme={CustomTheme}>
            <ErrorBoundary>
              <Routes />
            </ErrorBoundary>
            <CustomSnackbar />
            {/* MySchool Smart Search Widget */}
            <ChatbotWidget />
          </ThemeProvider>
        </PersistGate>
        <Snackbar open={open} autoHideDuration={6000} 
          anchorOrigin={{vertical : 'bottom', horizontal: 'right'}}
          onClose={() => setOpen(false)}>
          <Alert onClose={() => setOpen(false)} severity="info" icon={false} >
            <h3>{notification?.title}</h3>
            <p>{notification?.body}</p>
          </Alert>
        </Snackbar>
      </Provider>
    </ErrorBoundary>
  );
}
export default App;
