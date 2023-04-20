import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';
import { Station } from '../station';
import { StationPair } from '../stationPair';
import { StationPairNull } from '../stationPairNull';
import { Departure, Departures } from '../departures';
import { Observable, map, of, takeWhile, timer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-travel',
  templateUrl: './travel.component.html',
  styleUrls: ['./travel.component.css']
})
export class TravelComponent implements OnInit{

  constructor(private api: ApiServiceService, private route: ActivatedRoute){}


  preventDefault(e:Event) {    
    e.preventDefault();
  }
  
  ngOnInit(){
    this.route.queryParams
      .subscribe(params => {
        if(params["station"] !== undefined){
          this.queryStation = params["station"]
        }
        if(params["name"] !== undefined){
          this.queryStationName = params["name"]
        }
        console.log(this.queryStation, this.queryStationName)
        if(this.queryStation.length === this.queryStationName.length)
        for (let i = 0; i < this.queryStation.length; i++) {
          this.addStationQuery(this.queryStation[i], this.queryStationName[i])
        }
      }
    );
  }

  onInputEnterEvent(e: Event){
    this.getStationName(this.station)
  }

  getStationName(station: string){
    let ret = this.api.getStationName(station)

    if(ret.error !== null || ret.body === null){
      console.error("Problem in getStationName " + ret.error)
      return
    }

    ret.body.subscribe((recJSON: any) => {
      this.stations = recJSON["ResponseData"]
    })
  }

  addStationQuery(siteID: string, name: string){
    let station: Station = {name: name, siteID: siteID, dep: null}

    if(this.stationPair.one === null){
      this.stationPair.one = station

    }
    else {
      this.stationPair.two = station

    }
    this.stations.length = 0
    if (this.stationPair.two !== null){

      this.addedStations.push({one: this.stationPair.one, two: this.stationPair.two})
      this.getTraffic(this.stationPair.one, this.stationPair.two)
      this.stationPair.one = null
      this.stationPair.two = null
    }
  }

  addStation(index: number){
    
    let reg = new RegExp("\\(.*\\)")
    if(this.stationPair.one === null){
      this.stationPair.one = {name: this.stations[index]["Name"], siteID: this.stations[index]["SiteId"], dep: null}
      this.stationPair.one.name = this.stationPair.one.name.replace(reg, "").trim()

    }
    else {
      this.stationPair.two = {name: this.stations[index]["Name"], siteID: this.stations[index]["SiteId"], dep: null}
      this.stationPair.two.name = this.stationPair.two.name.replace(reg, "").trim()

    }
    this.stations.length = 0
    if (this.stationPair.two !== null){

      this.addedStations.push({one: this.stationPair.one, two: this.stationPair.two})
      this.getTraffic(this.stationPair.one, this.stationPair.two)
      this.stationPair.one = null
      this.stationPair.two = null
    }
  }

  getTraffic(startStation: Station, endStation: Station){
    let id = startStation.siteID + endStation.siteID
    let startTime = "60"

    let startNull = this.getStationReal(startStation, startTime)
    let endNull = this.getStationReal(endStation, "60")

    if(startNull === null || endNull === null){
      console.error("Couldn't get at least one of the stations.")
      return
    }
  }


  private matchingTraffic(startDeps: Array<Departure>, endDeps: Array<Departure>): Array<(Departure | null)[]>{
    let retList = new Array<(Departure | null)[]>()
    let destinations = new Array<string>()
    
    startDeps.forEach((startDep: Departure) => {
      let added = false
      endDeps.forEach((endDep: Departure) => {
        if(startDep.JourneyNumber === endDep.JourneyNumber){
          let startTime = startDep.TimeTabledDateTime
          if (startDep.ExpectedDateTime !== undefined){
            startTime = startDep.ExpectedDateTime
          }
          let endTime = endDep.TimeTabledDateTime
          if (endDep.ExpectedDateTime !== undefined){
            endTime = endDep.ExpectedDateTime
          }
          if(startTime < endTime){
            let time = new Date(endTime).getTime() - new Date(startTime).getTime() 

            this.stationTimes.push({
              diffTime: time,
              journeyNumber: startDep.JourneyNumber,
              journeyDirection: startDep.JourneyDirection,
              lineNumber: startDep.LineNumber,
            })

            retList.push([startDep, endDep])
            destinations.push(startDep.Destination)
            added = true
          }
        }
      })
      if(!added){
        if(destinations.includes(startDep.Destination)){
          retList.push([startDep, null])
        }
      }
    });
    return retList
  }
  
  scrollOptions(event: WheelEvent, e: HTMLElement, length: number){
    let scroll = e.scrollTop

    let scrollSaved = scroll
    let lengthSaved = length
    
    let adjustment = length - scroll % length

    if(adjustment % length !== 0)
      scroll = scroll + adjustment
    length /= 2
    length += 1
    if(event.deltaY < 0){
      scroll -= length
      scrollSaved -= lengthSaved
    }
    else{
      scroll += length
      scrollSaved += lengthSaved
    }
    e.scroll({
      top: scroll,
      left: 0,
    });
    
    let totalScroll = e.scrollHeight - e.offsetHeight
    console.log(e.childElementCount)
    if(e.childElementCount > 3){
      if(totalScroll <= scrollSaved){
        e.parentElement?.lastElementChild?.classList.remove("visible")
      }
      else{
        e.parentElement?.lastElementChild?.classList.add("visible")
      }
      if(0 >= scrollSaved){
        e.parentElement?.firstElementChild?.classList.remove("visible")
      }
      else{
        e.parentElement?.firstElementChild?.classList.add("visible")
      }
    }
    else{
      e.parentElement?.lastElementChild?.classList.remove("visible")
      e.parentElement?.firstElementChild?.classList.remove("visible")
    }
    
  }

  convertRemToPixels(rem: number): number {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  clearSelect(startStation: Station, endStation: Station, index:number){
    
    let id = startStation.siteID + endStation.siteID + index
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)

    let temp = listUL.parentElement?.previousElementSibling as HTMLSelectElement
    temp.value = "Choose Mode"
  }

  clearTraffic(startStation: Station, endStation: Station, index:number){
    let id = startStation.siteID + endStation.siteID + index
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)

    if(listUL === null){
      id = endStation.siteID + startStation.siteID + index
      listUL = (document.getElementById(id + "ul") as HTMLUListElement)
    }


    let chosen = document.getElementsByClassName("chosenTime")
    if(chosen.length === 1){
      if(chosen[0].firstChild !== null){
        let temp = chosen[0].firstChild as HTMLButtonElement
        temp.classList.add("whiteHover")
        this.tripTimes[index] = null
        this.tripTimeCalc()
      }
    }

    while (listUL.childNodes.length > 0) {
      listUL.removeChild(listUL.lastElementChild!);
    } 
    listUL.parentElement?.lastElementChild?.classList.remove("visible")
    listUL.parentElement?.firstElementChild?.classList.remove("visible")


    
  }

  getMatchingTraffic(startStation: Station, endStation: Station, index:number){
    let id = startStation.siteID + endStation.siteID + index

    let mode: string = "buses"
    if(document.getElementById(id) !== null)
      mode = (document.getElementById(id) as HTMLSelectElement).value
    
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)


    if(startStation.dep === null || endStation.dep === null){
      console.error("Station has no departures")
      return
    }

    var supportsPassive = true;
    var wheelOpt = supportsPassive ? { passive: false } : false;
    var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
    
    if(!this.addedEventListeners.includes(id)){
      listUL.addEventListener('DOMMouseScroll', (e: Event) => {this.preventDefault(e); this.scrollOptions(e as WheelEvent, listUL, this.convertRemToPixels(3))}, false); // older FF
      listUL.addEventListener(wheelEvent, (e: Event) => {this.preventDefault(e); this.scrollOptions(e as WheelEvent, listUL, this.convertRemToPixels(3))}, wheelOpt); // modern desktop
      this.addedEventListeners.push(id)
    }
    let matching = this.matchingTraffic(startStation.dep.getDepartures(mode), endStation.dep.getDepartures(mode))
    this.clearTraffic(startStation, endStation, index)
    matching.forEach(e => {
          

      let li = document.createElement('li') as HTMLLIElement
      let button = document.createElement('button') as HTMLButtonElement
      let text = document.createElement('span') as HTMLSpanElement
      let buttonWarning = document.createElement('span') as HTMLSpanElement
      let buttonWarningText = document.createElement('span') as HTMLSpanElement
      let buttonTextLeft = document.createElement('span') as HTMLSpanElement
      let buttonTextMiddle = document.createElement('span') as HTMLSpanElement
      let buttonTextRight = document.createElement('span') as HTMLSpanElement
      let buttonUnchoose = document.createElement('button') as HTMLButtonElement
      let start = e[0]
      let end = e[1]

      let startTimeFinal: Date
      let endTimeFinal: Date | null
      
      let modeDisplayClass: string[] = []

      if(start !== null && end !== null){
        let startTime = start.TimeTabledDateTime
        if (start.ExpectedDateTime !== undefined){
          startTime = start.ExpectedDateTime
        }
        let endTime = end.TimeTabledDateTime
        if (end.ExpectedDateTime !== undefined){
          endTime = end.ExpectedDateTime
        }

        startTime = new Date(startTime)
        endTime = new Date(endTime)
        let startTimeText = startTime.toLocaleTimeString("se-SE", {hour12: false})
        let endTimeText = endTime.toLocaleTimeString("se-SE", {hour12: false})

        buttonTextLeft.textContent = startTimeText
        buttonTextMiddle.classList.add("arrow")
        buttonTextRight.textContent = endTimeText

        startTimeFinal = startTime
        endTimeFinal = endTime
      }
      else if(start !== null){
        let startTime = start.TimeTabledDateTime
        if (start.ExpectedDateTime !== undefined){
          startTime = start.ExpectedDateTime
        }
        startTime = new Date(startTime)
        
        let startTimeText = startTime.toLocaleTimeString("se-SE", {hour12: false})
        buttonTextLeft.textContent = startTimeText
        buttonTextMiddle.classList.add("arrow")
        buttonTextRight.textContent = "(?)"
        buttonTextRight.title = "Precise data of departure time isn't available yet."
        
        let sameTripTime = 0

        this.stationTimes.forEach((e) => {
          if(e.journeyDirection === start?.JourneyDirection)
            if(e.lineNumber === start.LineNumber)
              sameTripTime = e.diffTime
        })
        endTimeFinal = null
        if(sameTripTime !== 0){
          buttonTextRight.textContent = new Date(startTime.getTime() + sameTripTime).toLocaleTimeString("se-SE", {hour12: false}) + " (?)"
          endTimeFinal = new Date(startTime.getTime() + sameTripTime)
          buttonTextRight.title = "Estimation of departure time."
        }
        
        buttonTextRight.classList.add("tooltip")

        startTimeFinal = startTime
      }

      if(start !== null){
            
        text.innerHTML = start.LineNumber
        if(mode === "buses"){
          switch (start.GroupOfLine) {
            case null:
              modeDisplayClass = ["buses"]
              break;
            case 'ersättningsbuss':
              modeDisplayClass = ["buses", "ersattningsbuss"]
              break;
            case 'blåbuss':
              modeDisplayClass = ["buses", "blabuss"]
              break;
            case 'närtrafiken':
              modeDisplayClass = ["buses", "nartrafiken"]
              break;
          
            default:
              modeDisplayClass = ["buses"]
              break;
          }
        }
        if(mode === "trams"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "tvärbanan":
              modeDisplayClass = ["trams", "tvarbanan"]
              break;
            case "roslagsbanan":
              modeDisplayClass = ["trams", "roslagsbanan"]
              break;
            case "spårväg city":
              modeDisplayClass = ["trams", "sparvagcity"]
              break;
            case "nockebybanan":
              modeDisplayClass = ["trams", "nockebybanan"]
              break;
            case "lidingöbanan":
              modeDisplayClass = ["trams", "lidingobanan"]
              break;
              
            default:
              modeDisplayClass = ["trams"]
              break;
          }
        }
        if(mode === "trains"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "pendeltåg":
              modeDisplayClass = ["trains", "pendeltag"]
              break;
          
            default:
              modeDisplayClass = ["trains"]
              break;
          }
        }
        if(mode === "metros"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "tunnelbanans gröna linje":
              modeDisplayClass = ["metros", "grona"]
              break;
            case "tunnelbanans grön linje":
              modeDisplayClass = ["metros", "grona"]
              break;
            case "tunnelbanans blåa linje":
              modeDisplayClass = ["metros", "blaa"]
              break;
            case "tunnelbanans blå linje":
              modeDisplayClass = ["metros", "blaa"]
              break;
            case "tunnelbanans röda linje":
              modeDisplayClass = ["metros", "roda"]
              break;
            case "tunnelbanans röd linje":
              modeDisplayClass = ["metros", "roda"]
              break;
          
            default:
              modeDisplayClass = ["metros"]
              break;
          }
        }
        if(mode === "ships"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "waxholmsbolagets":
              modeDisplayClass = ["ships", "waxholmsbolagets"]
              break;
            case "pendelbåt":
              modeDisplayClass = ["ships", "pendelbat"]
              break;
          
            default:
              modeDisplayClass = ["ships"]
              break;
          }
        }
      }

      if(matching.length > 3){
        listUL.parentElement?.lastElementChild?.classList.add("visible")
      }



      buttonUnchoose.textContent = "×"
      buttonUnchoose.classList.add("options_button_button")
      buttonUnchoose.classList.add("whiteHover")
      buttonUnchoose.addEventListener("click", (e:Event) => {this.preventDefault(e); this.deCompressList(e as MouseEvent, index)})

      buttonWarning.classList.add("options_button_warning")
      buttonWarningText.classList.add("options_button_warning_text", "roundedBottom", "roundedTop")
      buttonTextLeft.classList.add("options_button_text")
      buttonTextMiddle.classList.add("options_button_text")
      buttonTextRight.classList.add("options_button_text")
      button.classList.add("options_button")
      button.classList.add("whiteHover")
      text.classList.add("options_text")
      modeDisplayClass.forEach(displayClass =>{
        text.classList.add(displayClass)
      })

      let deviations: Array<{Consequence: string, ImportanceLevel: number, Text: string}> = []
      if(start !== null){
        if (start.Deviations !== null){
          start.Deviations.forEach((startDev: {Consequence: string, ImportanceLevel: number, Text: string}) => {
            deviations.push(startDev)
          })
        }
      }
      if(end !== null){
        if(end.Deviations !== null){
          end!.Deviations.forEach((endDev: {Consequence: string, ImportanceLevel: number, Text: string}) => {
            deviations.push(endDev)
          })
        }
      }

      if(deviations.length > 0){

        buttonWarning.textContent = "⚠"
        buttonWarning.classList.add("visible")
        let il = 0
        let addedDev: string[] = []
        deviations.forEach((dev: {Consequence: string, ImportanceLevel: number, Text: string}) =>{
          if(dev.ImportanceLevel > il)
            il = dev.ImportanceLevel
          if(!addedDev.includes(dev.Text)){
            let p = (document.createElement("p") as HTMLParagraphElement)
            p.innerHTML = dev.Text
            buttonWarningText.appendChild(p)
            addedDev.push(dev.Text)
          }
        })
        if(il === 7){
          buttonWarning.classList.add("warning-red")
        }
        else
          buttonWarning.classList.add("warning-yellow")
      }

      button.addEventListener("click", (e: Event) => {this.preventDefault(e); this.compressList(e as MouseEvent, index, {from: startTimeFinal, to: endTimeFinal})});

      
      button.appendChild(text)
      button.appendChild(buttonWarning)
      button.appendChild(buttonWarningText)
      button.appendChild(buttonTextLeft)
      button.appendChild(buttonTextMiddle)
      button.appendChild(buttonTextRight)
      button.appendChild(buttonUnchoose)
      li.appendChild(button)
      listUL.appendChild(li)

    })
  }

  getStationReal(station: Station, time: string){
    let ret = this.api.getStationReal(station.siteID, time)
  
    
    if(ret.error !== null || ret.body === null){
      console.error("Nothing returned travel " + ret.error)
      return
    }
    else{

      ret.body.subscribe((recJSON: any) => {
        if(recJSON.StatusCode !== null && recJSON.StatusCode !== 0){
          console.error(recJSON.StatusCode)
          console.error(recJSON.Message)
        }
        let dep: Departures | null = null

        dep = new Departures(recJSON.Message, recJSON["ResponseData"]["Buses"], recJSON["ResponseData"]["Metros"], recJSON["ResponseData"]["Trains"], recJSON["ResponseData"]["Trams"], recJSON["ResponseData"]["Ships"])

        station.dep = dep

      })
    }
  }

  deCompressList(e: MouseEvent, index: number){

    let button = e.target as HTMLButtonElement

    let parent = button.parentElement


    while(parent?.tagName !== "LI" && parent !== null){
      parent = parent.parentElement
    }

    if(parent === null){
      console.error("Couldn't find parent of pressed button")
      return
    }
    if(parent.parentElement!.childElementCount > 3){
      if(parent.previousSibling !== null)
        parent.parentElement?.parentElement?.firstElementChild?.classList.add("visible")
  
      if(parent.nextSibling !== null)
        parent.parentElement?.parentElement?.lastElementChild?.classList.add("visible")
    }

    parent.classList.remove("chosenTime")

    if(parent.firstChild !== null){
      let temp = parent.firstChild as HTMLButtonElement
      temp.classList.add("whiteHover")
      this.tripTimes[index] = null
      this.tripTimeCalc()
    }

    let nextSib = parent.nextElementSibling
    while(nextSib !== null){
      nextSib.classList.remove("displayNone")
      nextSib = nextSib.nextElementSibling
    }
    let prevSib = parent.previousElementSibling
    while(prevSib !== null){
      prevSib.classList.remove("displayNone")
      prevSib = prevSib.previousElementSibling
    }
  }

  compressList(e: MouseEvent, index: number, fromTo: {from: Date, to: Date | null}){

    let button = e.target as HTMLButtonElement

    if(button.classList.contains("options_button_button"))
      return

    let parent = button.parentElement


    while(parent?.tagName !== "LI" && parent !== null){
      parent = parent.parentElement
    }

    if(parent === null){
      console.error("Couldn't find parent of pressed button")
      return
    }

    parent.parentElement?.parentElement?.firstElementChild?.classList.remove("visible")
    parent.parentElement?.parentElement?.lastElementChild?.classList.remove("visible")

    parent.classList.add("chosenTime")

    if(parent.firstChild !== null){
      let temp = parent.firstChild as HTMLButtonElement
      temp.classList.remove("whiteHover")
      this.tripTimes[index] = fromTo
      this.tripTimeCalc()
    }

    let nextSib = parent.nextElementSibling
    while(nextSib !== null){
      nextSib.classList.add("displayNone")
      nextSib = nextSib.nextElementSibling
    }
    let prevSib = parent.previousElementSibling
    while(prevSib !== null){
      prevSib.classList.add("displayNone")
      prevSib = prevSib.previousElementSibling
    }
  }

  tripTimeCalc(){
    while(this.tripTimes.length > this.tripTimesMS.length)
      this.tripTimesMS.push(null)
    while(this.tripTimes.length < this.tripTimesMS.length)
      this.tripTimesMS.pop()

    if(this.tripTimes[0]){

      let now = Date.now()
      let ms = this.tripTimes[0]!.from.getTime() - now
      if(ms < 0){
        this.tripTimesMSFirst = of(-1)
      }
      else
        this.tripTimesMSFirst = timer(0, 1000).pipe(
          map(n => (ms/1000 - n) * 1000),
          takeWhile(n => n >= -1001),
        );
    }
    for (let index = 0; index + 1 < this.tripTimes.length; index++) {
      if(this.tripTimes[index] && this.tripTimes[index + 1]){
        let start = this.tripTimes[index]!.to
        let end = this.tripTimes[index + 1]!.from


        if(start){
          this.tripTimesMS[index + 1] = end.getTime() - start.getTime()
        }
      }
      else{
        this.tripTimesMS[index + 1] = null
      }
    }
  }

  tripTimeCalcFromDelete(index: number){
    this.tripTimes.splice(index, 1)
    this.tripTimeCalc()
  }
  tripTimeCalcNull(index: number){
    this.tripTimes[index] = null
    this.tripTimeCalc()
  }

  switchStations(startStation: Station, endStation: Station, index:number){

    
    let id = startStation.siteID + endStation.siteID + index


    this.addedStations[index].one = endStation
    this.addedStations[index].two = startStation

    
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)
    let select = (document.getElementById(id) as HTMLSelectElement)

    let newID = endStation.siteID + startStation.siteID + index

    listUL.id = newID
    select.id = newID

  }

  deleteStations(index:number){
    this.addedStations.splice(index, 1)
  }

  getRoute(){
    let url = []
    url.push(window.location.href.split('?')[0] + "?")
    this.addedStations.forEach((sp: StationPair) =>{
      console.log(sp.one.siteID, sp.two.siteID)
      url.push("station=" + sp.one.siteID + "&" + "name=" + sp.one.name + "&" + "station=" + sp.two.siteID + "&" + "name=" + sp.two.name + "&")
    })

    console.log(url)
    let urlString = url.join("")
    navigator.clipboard.writeText(urlString);

    // Alert the copied text
    alert("Copied the text: " + urlString);
  }

  addedEventListeners: string[] = []

  tripTimesMSFirst?: Observable<number>
  tripTimesMS: (number | null)[] = []
  tripTimes: ({from: Date, to:Date | null} | null)[] = []

  addedStations: Array<StationPair> = []
  stationPair: StationPairNull = {one: null,two: null}

  stationTimes: {diffTime: number,
    journeyNumber: number,
    journeyDirection: number,
    lineNumber: string,
  }[]= []

  stations = []
  station: string = ""
  key = "cea6074a2f0248a3b466aae7a88af063"

  queryStation: string[] = []
  queryStationName: string[] = []

  travelModes = ["bus", "metro", "train", "tram", "ship"]
}
