import React from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import './Calendar.css'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { Button, Modal, TextField, Typography } from '@mui/material';
import { ReactComponent as Crossicon } from "../../../../assests/homeScreen/crossicon.svg";
import MSTextField from '../../../../customTheme/textField/MSTextField';
import { useSelector, useDispatch } from "react-redux";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { SearchImages } from '../../../../redux/fetchSearchSlice';
import { useLocation } from 'react-router-dom';
import { styles } from './constant'
const DragAndDropCalendar = withDragAndDrop(Calendar)
const CalendarView = (props) => {
  const { searchedImages, loading } = useSelector(
    (state) => state.searchedImage
  );
  const containerRef = React.useRef(null);
  const dispatch = useDispatch();
  const { continuationToken } = useSelector(state => state.api);
  const localizer = momentLocalizer(moment)
  const [events, setEvents] = React.useState([])
  const [selectedEvent, setSelectedEvent] = React.useState({})
  const [open, setOpen] = React.useState(false)     // This is used for opening modal and adding new event
  const [editOpen, setEditOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState()
  const calenderRef = React.useRef(null)
  const [calenderView, setCalenderView] = React.useState(Views.MONTH)
  const [selectedImage, setSelectedImage] = React.useState(null)
  const [draggedEvent, setDraggedEvent] = React.useState()
  const [displayDragItemInCell, setDisplayDragItemInCell] = React.useState(true)
  const [counters, setCounters] = React.useState({ English: 0, Maths: 0, EVS: 0, GK: 0, Computer: 0, Hindi: 0,
    LunchBreak: 0 })
  const location = useLocation()
  var uniqueId = Math.random().toString(36).substr(2, 9);
  const handleAddNewEvent = (e, newId) => {
    let data = [...events]
      data.push(open)
    setEvents(data)
    setOpen(false)
    setEditOpen(false)
  }
  const handleUpdateEvent = () => {
    const eleIndex = events.findIndex((ele) => ele.id === selectedEvent.id)
    let data = [...events]
    if (eleIndex !== -1) {
      events[eleIndex].title = open.title;
      events[eleIndex].start = open.start;
      // events[eleIndex].start = moment(open.end).startOf('day').toDate()
      events[eleIndex].end = open.end;
      // events[eleIndex].end = moment(open.start).endOf('day').toDate()
      events[eleIndex].remark = open.remark;
      events[eleIndex].resource = selectedImage;
    }
    setEvents(data)
    setOpen(false)
    setEditOpen(false)
  }
  const handleClose = () => {
    setOpen(false)
    setEditOpen(false)
  }
  // Function save search text field text in variable
  // @params [event] 
  const handleSearchText = (e) => {
    setSearchText(e.target.value);
  }
  // Function handling events rendering inside Agenda
  const EventAgenda = ({ event }) => {
    let fileName = event?.resource
    let url = ""
    if (fileName) {
      fileName = fileName.split('/')
      fileName = fileName[fileName.length - 1].split('.')[0]
      url = `${window.location.origin}/views/result?text=${fileName}`
    }
    return (
      <span>
        <em style={{ color: 'magenta' }}>{event.title}</em>
        {event?.remark ? <p>Remarks : {event?.remark}</p> : null}
        {event?.resource ? <p>Resource : <a href={url} target="_blank" rel="noopener noreferrer">{fileName}</a></p> : null}
      </span>
    )
  }
  // Function Handle Search of images
  const handleImageSearch = () => {
    let header = {
      "Content-Type": "application/json",
      // 'Accept': 'application/json',
      //   "Authorization": `Bearer ${accessToken}`
    };
    dispatch(
      SearchImages({
        headers: header,
        method: "GET",
        body: {
          query: searchText.toLowerCase(),
        },
      })
    ).then(() => {});
  }
  // Handle Rendering of Resources
  const ResourcesRender = () => {
    if (!searchedImages || Object.keys(searchedImages || {}).length === 0) {
      return (
        <div>
          <Typography>No Result</Typography>
        </div>
      )
    } else {
      return (
        <>
          {Object.keys(searchedImages || {}).map((k, i) =>
            <img
              key={`calenderImages-${i}`}
              src={searchedImages[k]}
              className={selectedImage === k ? 'calenderSelectedImage' : null}
              onClick={() => {
                handleFieldsChange({ target: { value: k } }, 'resource')
                setSelectedImage(k)
              }}
              width={200} height={200} />
          )}
        </>
      )
    }
  }
  const handleFieldsChange = (e, fieldName) => {
    setOpen(current => {
      const copy = { ...current }
      copy[fieldName] = e.target.value
      return copy
    })
  }
  const handleSelectSlot = (e) => {
    e.id = uniqueId;
    var newId = e.id;
    let view = calenderRef.current.props.view
    switch (view) {
      case "month":
        let data = e
        data.end = moment(e.start).endOf('day').toDate()
        data.allDay = true
        setOpen(data)
      default:
        setOpen(e)
    }
  }
  const onSelectEvent = (event) => {
    setEditOpen(true)
    setOpen(event)
    setSelectedEvent(event);
  }
  function printDiv() {
    const divToPrint = document.querySelector('.rbc-calendar');
    var newWin = window.open('', 'Print-Window');
    newWin.document.open();
    newWin.document.write('<html><head><style>' +
      styles +
      '</style></head><body onload="window.print()"  >' +
      divToPrint.innerHTML +
      '</body></html>');
    newWin.document.close();
    setTimeout(function () { newWin.close(); }, 10);
  }
  const minTime = new Date();
  minTime.setHours(7, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(20, 0, 0);
  const eventPropGetter = (event) => ({
    ...(event.isDraggable
      ? { className: 'isDraggable' }
      : { className: 'nonDraggable' }),
  })
  const resizeEvent = ({ event, start, end }) => {
    setEvents((prev) => {
      const existing = prev.find((ev) => ev.id === event.id) ?? {}
      const filtered = prev.filter((ev) => ev.id !== event.id)
      return [...filtered, { ...existing, start, end }]
    })
  }
  const handleDragStart = (event) => setDraggedEvent(event)
  const dragFromOutsideItem = () => draggedEvent
  const customOnDragOver = (dragEvent) => {
    // check for undroppable is specific to this example
    // and not part of API. This just demonstrates that
    // onDragOver can optionally be passed to conditionally
    // allow draggable items to be dropped on cal, based on
    // whether event.preventDefault is called
    if (draggedEvent !== 'undroppable') {
      // Event handled
      dragEvent.preventDefault()
    }
  }
  const onDropFromOutside = ({ start, end, allDay: isAllDay }) => {
    if (draggedEvent === 'undroppable') {
      setDraggedEvent(null)
      return
    }
    const { name } = draggedEvent
    const event = {
      title: name,
      start,
      end,
      isAllDay,
      id: uniqueId,
    }
    setDraggedEvent(null)
    let data = [...events]
    data.push(event)
    setEvents(data)
  }
  const moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }) => {
    const { allDay } = event
    if (!allDay && droppedOnAllDaySlot) {
      event.allDay = true
    }
    setEvents((prev) => {
      const existing = prev.find((ev) => ev.id === event.id) ?? {}
      const filtered = prev.filter((ev) => ev.id !== event.id)
      return [...filtered, { ...existing, start, end, allDay }]
    })
  }
  return (
    <div className='calendarMainContainer'>
      <div className='calendarEventContainer'>
        {Object.entries(counters).map(([name, count]) => (
          <div
            className='calendarEventTitle'
            draggable="true"
            key={name}
            onDragStart={() =>
              handleDragStart({ title: name, name })
            }
          >
            {name}
          </div>
        ))}
      </div>
      <div className='calendarContainer'>
        <Button variant='contained'
          style={{ maxWidth: 150 }}
          onClick={printDiv}
          color='secondary' >Download</Button>
        <DragAndDropCalendar
          components={{
            agenda: {
              event: EventAgenda
            }
          }}
          dragFromOutsideItem={dragFromOutsideItem}
          draggableAccessor="isDraggable"
          eventPropGetter={eventPropGetter}
          onDropFromOutside={onDropFromOutside}
          onDragOver={customOnDragOver}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          resizable
          toolbar={true}
          style={{ flex: 1, width: '100%' }}
          localizer={localizer}
          ref={calenderRef}
          defaultView={calenderView}
          defaultDate={new Date()}
          events={events}
          max={maxTime}
          min={minTime}
          onSelectEvent={(event) => onSelectEvent(event)}
          onSelectSlot={handleSelectSlot}
          popup
          selectable
        />
        <Modal className="openModal" onClose={handleClose} open={Boolean(open)}>
          <div className='calenderParentCard'>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Typography variant='h6' fontSize={16} fontWeight="bold">{!editOpen ? "Add New Event" : "Update Event"}</Typography>
              <Crossicon
                onClick={() => {
                  setOpen(false)
                  setEditOpen(false)}}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 50, width: '100%' }}>
              <div className='calenderModalChild'>
                <MSTextField id="calenderLabel" type="text" onChange={handleFieldsChange} value={open.title} fieldName="title"
                  placeholder="Enter Event Name" label={"Event Name"} />
                <MSTextField id="calenderRemarks" type="text" onChange={handleFieldsChange} value={open.remark} fieldName="remark"
                  placeholder="Enter Remarks" label={"Remarks"} />
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label htmlFor={"calenderSelectedate"}>Selected Date</label>
                    <DesktopDatePicker
                      id="calenderSelectedate"
                      inputFormat="MM/DD/YYYY"
                      value={open.start}
                      onChange={(e) => {
                        let data = {
                          target: {
                            value: e
                          }
                        }
                        handleFieldsChange(data, 'start')
                        handleFieldsChange(data, 'end')
                      }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                    {open.allDay ? <Button
                      color='secondary'
                      onClick={() => handleFieldsChange({ target: { value: false } }, "allDay")}
                      variant='outlined'>Add Time</Button> : null}
                  </div>
                  {!open.allDay ? <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label htmlFor={"calenderStartTime"}>Start Date</label>
                      <TimePicker
                        color="secondary"
                        id="calenderStartTime"
                        value={open.start}
                        minutesStep={30}
                        onChange={(e) => {
                          let data = {
                            target: {
                              value: e.toDate()
                            }
                          }
                          handleFieldsChange(data, 'start')
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label htmlFor={"calenderEndTime"}>End Date</label>
                      <TimePicker
                        id="calenderEndTime"
                        value={open.end}
                        minutesStep={30}
                        onChange={(e) => {
                          let data = {
                            target: {
                              value: e.toDate()
                            }
                          }
                          handleFieldsChange(data, 'end')
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </div>
                  </div> : null}
                </LocalizationProvider>
                <Button variant='contained'
                  style={{ minWidth: 130 }}
                  onClick={!editOpen ? handleAddNewEvent : handleUpdateEvent}
                  disabled={open.title ? false : true}
                  color='secondary' >{!editOpen ? "Create Event" : "Update Event"}</Button>
              </div>
              <div className='calenderModalChild'>
                <div style={{ display: 'flex', gap: 30 }}>
                  <TextField
                    className="homeSearchBar calenderSearch"
                    placeholder="Search your wish here"
                    fullWidth
                    onChange={handleSearchText}
                  />
                  <Button
                    variant='contained'
                    style={{ minWidth: 130 }}
                    onClick={handleImageSearch}
                    color='secondary' >Search</Button>
                </div>
                <div
                  ref={containerRef}
                  style={{
                    flex: 1, display: 'flex',
                    maxHeight: 400,
                    flexWrap: 'wrap',
                    gap: 15,
                    overflowY: 'scroll'
                  }}>
                  <ResourcesRender />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
export default CalendarView;
