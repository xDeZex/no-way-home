import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';
import { Station } from '../station';
import { StationPair } from '../stationPair';
import { StationPairNull } from '../stationPairNull';
import { Departure, Departures } from '../departures';
import { Observable, map, of, takeWhile, timer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SavedDeparture } from "../saved-departure";

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
        try {
          let json = ""
          if(params["json"] !== undefined){
              
            json = params["json"]
          }
          else{
            console.error("The URL has no json")
            throw Error
          }
          if(json !== ""){
            let solved = decodeURIComponent(json)

            //http://localhost:4200/?json={"routes":[{"station":["9112","1079","1079","9523","9540","9541"],"name":["Alvik","Stockholm Odenplan","Stockholm Odenplan","Rönninge station","Gnesta","Mölnbo"]}]}

            //http://localhost:4200/?hash={"station":["9000","9000","9600","9600","1854","1854"],"name":["Stockholm City","Stockholms central","Stockholm Odenplan","Stockholms östra","Stockholms södra","Stockholmsvägen"]}


            params = JSON.parse(solved)
          }
          if(params["routes"] !== undefined){
            let routes = params["routes"].reverse()
            for (let index = 0; index < params["routes"].length; index++) {
              if(routes[index]["station"] !== undefined){
                this.queryStation = routes[index]["station"]
              }
              if(routes[index]["name"] !== undefined){
                this.queryStationName = routes[index]["name"]
              }
              if(this.queryStation.length === this.queryStationName.length)
                for (let i = 0; i < this.queryStation.length; i++) {
                  this.addStationQuery(this.queryStation[i], this.queryStationName[i])
                }
                if(index !== params["routes"].length - 1){
                  this.saveRoute()
                }
            }
          }
          else{
            console.error("The URL has no routes")
            throw Error
          }
          
            
          
          
        } catch (error) {
          console.error("The URL was malformed or had no routes")
        }
        
      }
    );
  }

  getRoutesURL(){
    let json: {routes: {station: string[], name:string[]}[]} = {routes: []}
    let url: string[] = []
    this.addedStations.forEach((spList: StationPair[], index) => {
      json.routes[index] = {station: [], name: []}
      spList.forEach((sp: StationPair) =>{
        json.routes[index].name.push(sp.one.name)
        json.routes[index].name.push(sp.two.name)
        json.routes[index].station.push(sp.one.siteID)
        json.routes[index].station.push(sp.two.siteID)
      })
    })
    
    let jsonString = JSON.stringify(json)

    
    let urlString = window.location.href.split('?')[0] + "?json=" + jsonString
    navigator.clipboard.writeText(urlString);

    // Alert the copied text
    alert("Copied the text: " + urlString);

    
  }


  onInputEnterEvent(e: Event){
    this.getStationName(this.station)
  }

  getStationName(station: string){
    let ret = this.api.getStationName(station)
  
    if(!ret){
      console.error("Problem in getStationName")
      return
    }

    ret.subscribe((recJSON: any) => {
      if(Object.keys(recJSON).includes("ResponseData")){
        this.stations = recJSON["ResponseData"]
      }
      else{
        console.error(recJSON.error)
      }
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

      this.addedStations[0].push({one: this.stationPair.one, two: this.stationPair.two, savedDepartures: []})
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

      this.addedStations[0].push({one: this.stationPair.one, two: this.stationPair.two, savedDepartures: []})
      this.getTraffic(this.stationPair.one, this.stationPair.two)
      this.stationPair.one = null
      this.stationPair.two = null
    }
  }

  updateTraffic(startStation: Station, endStation: Station){
    this.getStationReal(startStation, "60")
    this.getStationReal(endStation, "60")
  }

  getTraffic(startStation: Station, endStation: Station){
    this.getStationReal(startStation, "60")
    this.getStationReal(endStation, "60")
    
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
  
  scrollOptions(event: WheelEvent, id:string, length: number){

    let e = document.getElementById(id)

    if(e === null)
      return

    if(e.firstElementChild?.classList.contains("chosenTime") || e.firstElementChild?.classList.contains("displayNone"))
      return

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
    if(!(e!.scrollHeight - 144 - 44 <= e!.scrollTop && event.deltaY >= 0)){
      e.scroll({
        top: scroll,
        left: 0,
      });
    }
    
    let totalScroll = e.scrollHeight - e.offsetHeight
    if(e.childElementCount > 3){
      if(totalScroll - 1 <= scrollSaved){
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

  scrollTouch(event: TouchEvent, id: string){


    let touch = null

    if(this.previousTouch){
      for (let i = 0; i < event.changedTouches.length; i++) {
        if(event.changedTouches[i].identifier === this.previousTouch?.identifier)
          touch = event.changedTouches[i];
      }
      if(touch === null){
        this.previousTouch = null
        return
      }
      let listUL = document.getElementById(id)
      if(listUL === null)
        return
      
      let touchChange = touch.pageY - this.previousTouch?.pageY
      let totalScroll = listUL.scrollHeight - listUL.offsetHeight
      if(listUL.childElementCount > 3){
        if(listUL.scrollTop + 24 >= totalScroll){
          listUL.parentElement?.lastElementChild?.classList.remove("visible")
        }
        else{
          listUL.parentElement?.lastElementChild?.classList.add("visible")
        }
        if(listUL.scrollTop <= 24){
          listUL.parentElement?.firstElementChild?.classList.remove("visible")
        }
        else{
          listUL.parentElement?.firstElementChild?.classList.add("visible")
        }
      }
      else{
        listUL.parentElement?.lastElementChild?.classList.remove("visible")
        listUL.parentElement?.firstElementChild?.classList.remove("visible")
      }
  
  
    }
    if(!this.previousTouch)
      this.previousTouch = event.changedTouches[0]
    else
      this.previousTouch = touch
  }

  convertRemToPixels(rem: number): number {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  moveStationPair(index: number, amount: number){
    if(index + amount >= 0 && index + amount < this.addedStations[0].length){  
      let temp = this.addedStations[0][index]
      this.addedStations[0][index] = this.addedStations[0][index + amount]
      this.addedStations[0][index + amount] = temp

      let tempTime = this.tripTimes[0][index]
      this.tripTimes[0][index] = this.tripTimes[0][index + amount]
      this.tripTimes[0][index + amount] = tempTime

      this.tripTimeCalc()

    }

  }

  clearSelect(pair: StationPair, index:number){
    let startStation = pair.one
    let endStation = pair.two
    let id = startStation.siteID + endStation.siteID + index
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)

    let temp = listUL.parentElement?.previousElementSibling as HTMLSelectElement
    temp.value = "Choose Mode"
    pair.chosen = undefined
    pair.savedDepartures = []
  }

  clearInd(startStation: Station, endStation: Station, index:number){

    let id = startStation.siteID + endStation.siteID + index + "ul"

    let e = document.getElementById(id)

    if(e !== null){
      e.parentElement?.lastElementChild?.classList.remove("visible")
      e.parentElement?.firstElementChild?.classList.remove("visible")
    }
    



  }

  initInd(){
    let listOfUL = document.getElementsByClassName("addedStations_options")


    for (let i = 0; i < listOfUL.length; i++) {
      let element = listOfUL[i];
      if(element.childElementCount > -1){
        element.scrollTop = 0
          
        element.parentElement?.lastElementChild?.classList.add("visible")
        element.parentElement?.firstElementChild?.classList.remove("visible")
      }
      
    }
  }

  clearTraffic(startStation: Station, endStation: Station, index:number){
    return
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
        this.tripTimes[0][index] = null
        this.tripTimeCalc()
      }
    }

    while (listUL.childNodes.length > 0) {
      listUL.removeChild(listUL.lastElementChild!);
    } 
    listUL.parentElement?.lastElementChild?.classList.remove("visible")
    listUL.parentElement?.firstElementChild?.classList.remove("visible")


    
  }

  getMatchingTraffic(pair: StationPair, index:number){
    let startStation = pair.one
    let endStation = pair.two


    let id = startStation.siteID + endStation.siteID + index

    pair.chosen = undefined
    this.tripTimeCalcNull(index)

    let mode: string = ""
    if(document.getElementById(id) !== null)
      mode = (document.getElementById(id) as HTMLSelectElement).value

    if(mode === ""){
      console.error("No mode chosen")
      return
    }
    
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)


    if(startStation.dep === null || endStation.dep === null){
      console.error("Station has no departures")
      return
    }

    let matching = this.matchingTraffic(startStation.dep.getDepartures(mode), endStation.dep.getDepartures(mode))
    this.clearTraffic(startStation, endStation, index)
    this.addedStations[0][index].savedDepartures = []
    matching.forEach(e => {
      
      let depFromText: string = ""
      let depToText: string = ""
      let depToTextTitle: string = ""
      let depLine: string = ""
      let depMode: string[] = []
      let depIL: number = 0
      let depDeviations: Array<{Consequence: string, ImportanceLevel: number, Text: string}> = []
          

      let start = e[0]
      let end = e[1]

      let startTimeFinal: Date
      let endTimeFinal: Date | null

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

        depFromText = startTimeText
        depToText = endTimeText

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
        
        depFromText = startTimeText
        depToText = "(?)"
        depToTextTitle = "Precise data of departure time isn't available yet."

        let sameTripTime = 0

        this.stationTimes.forEach((e) => {
          if(e.journeyDirection === start?.JourneyDirection)
            if(e.lineNumber === start.LineNumber)
              sameTripTime = e.diffTime
        })
        endTimeFinal = null
        if(sameTripTime !== 0){

          depToText = new Date(startTime.getTime() + sameTripTime).toLocaleTimeString("se-SE", {hour12: false}) + " (?)"
          depToTextTitle = "Estimation of departure time."

          endTimeFinal = new Date(startTime.getTime() + sameTripTime)
        }
        

        startTimeFinal = startTime
      }

      if(start !== null){
        depLine = start.LineNumber
        //DEP
        if(mode === "buses"){
          switch (start.GroupOfLine) {
            case null:
              depMode = ["buses"]
              break;
            case 'ersättningsbuss':
              depMode = ["buses", "ersattningsbuss"]
              break;
            case 'blåbuss':
              depMode = ["buses", "blabuss"]
              break;
            case 'närtrafiken':
              depMode = ["buses", "nartrafiken"]
              break;
          
            default:
              depMode = ["buses"]
              break;
          }
        }
        if(mode === "trams"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "tvärbanan":
              depMode = ["trams", "tvarbanan"]
              break;
            case "roslagsbanan":
              depMode = ["trams", "roslagsbanan"]
              break;
            case "spårväg city":
              depMode = ["trams", "sparvagcity"]
              break;
            case "nockebybanan":
              depMode = ["trams", "nockebybanan"]
              break;
            case "lidingöbanan":
              depMode = ["trams", "lidingobanan"]
              break;
              
            default:
              depMode = ["trams"]
              break;
          }
        }
        if(mode === "trains"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "pendeltåg":
              depMode = ["trains", "pendeltag"]
              break;
          
            default:
              depMode = ["trains"]
              break;
          }
        }
        if(mode === "metros"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "tunnelbanans gröna linje":
              depMode = ["metros", "grona"]
              break;
            case "tunnelbanans grön linje":
              depMode = ["metros", "grona"]
              break;
            case "tunnelbanans blåa linje":
              depMode = ["metros", "blaa"]
              break;
            case "tunnelbanans blå linje":
              depMode = ["metros", "blaa"]
              break;
            case "tunnelbanans röda linje":
              depMode = ["metros", "roda"]
              break;
            case "tunnelbanans röd linje":
              depMode = ["metros", "roda"]
              break;
          
            default:
              depMode = ["metros"]
              break;
          }
        }
        if(mode === "ships"){
          switch (start.GroupOfLine.toLowerCase()) {
            case "waxholmsbolagets":
              depMode = ["ships", "waxholmsbolagets"]
              break;
            case "pendelbåt":
              depMode = ["ships", "pendelbat"]
              break;
          
            default:
              depMode = ["ships"]
              break;
          }
        }
      }

      if(matching.length > 3){
        
      }
      
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

        let il = 0
        let addedDev: string[] = []
        deviations.forEach((dev: {Consequence: string, ImportanceLevel: number, Text: string}) =>{
          if(dev.ImportanceLevel > il)
            il = dev.ImportanceLevel
          if(!addedDev.includes(dev.Text)){
            let p = (document.createElement("p") as HTMLParagraphElement)
            p.innerHTML = dev.Text
            addedDev.push(dev.Text)
            depDeviations.push(dev)
          }
        })
        depIL = il
      }

      let SD: SavedDeparture = {line: depLine, fromText: depFromText, toText: depToText, toTextTitle: depToTextTitle, mode: depMode, deviations: depDeviations, fromDate: startTimeFinal!, toDate: endTimeFinal!, deviationsImportance: depIL}

      this.addedStations[0][index].savedDepartures.push(SD)

    })
    listUL.scrollTop = 0
    if(matching.length > 3){
      listUL.parentElement?.lastElementChild?.classList.add("visible")
      listUL.parentElement?.firstElementChild?.classList.remove("visible")
    }
    else{
      listUL.parentElement?.lastElementChild?.classList.remove("visible")
      listUL.parentElement?.firstElementChild?.classList.remove("visible")
    }
  }

  getStationReal(station: Station, time: string): void{

    if(this.StationsReal[station.siteID] !== undefined && this.StationsRealTime[station.siteID] !== undefined){
      if(this.StationsRealTime[station.siteID] > Date.now() - 120000/2 && this.StationsReal[station.siteID].Message === ""){
        station.dep = this.StationsReal[station.siteID]
        return
      }
    }
    let ret = this.api.getStationReal(station.siteID, time)

    if(!ret){
      console.error("Nothing returned travel")
      return
    }
    else{

      this.StationsRealTime[station.siteID] = Date.now()
      ret.subscribe((recJSON: any) => {
        let dep: Departures | null = null
        
        if(recJSON["error"] !== undefined){
          console.error(recJSON.error)
          dep = new Departures(recJSON.error, [], [], [], [], [])
        }
        else if(recJSON.StatusCode !== null && recJSON.StatusCode !== 0){
          console.error(recJSON.Message, recJSON.StatusCode)
          dep = new Departures(recJSON.Message, [], [], [], [], [])
        }
        else{
          dep = new Departures("", recJSON["ResponseData"]["Buses"], recJSON["ResponseData"]["Metros"], recJSON["ResponseData"]["Trains"], recJSON["ResponseData"]["Trams"], recJSON["ResponseData"]["Ships"])
        }
        this.StationsReal[station.siteID] = dep
        this.StationsRealTime[station.siteID] = Date.now()
        station.dep = dep

      })
    }

  }

  deCompressList(e: MouseEvent, i: number){

    let button = e.target as HTMLButtonElement

    let parent = button.parentElement


    while(parent?.tagName !== "LI" && parent !== null){
      parent = parent.parentElement
    }

    if(parent === null){
      console.error("Couldn't find parent of pressed button")
      return
    }

    
    let index = Number.parseInt(parent.parentElement!.id.at(-3)!)


    if(parent.parentElement!.childElementCount > 3){
      if(parent.previousElementSibling !== null)
        parent.parentElement?.parentElement?.firstElementChild?.classList.add("visible")
  
      if(parent.nextElementSibling !== null)
        if(parent.nextElementSibling.nextElementSibling !== null)
          if(parent.nextElementSibling.nextElementSibling.nextElementSibling !== null)
            parent.parentElement?.parentElement?.lastElementChild?.classList.add("visible")
    }

    parent.classList.remove("chosenTime")

    if(parent.firstChild !== null){
      let temp = parent.firstChild as HTMLButtonElement
      temp.classList.add("whiteHover")
      this.tripTimes[0][index] = null
      this.tripTimeCalc()
      this.addedStations[0][i].chosen = undefined
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

  compressList(e: MouseEvent, fromTo: {from: Date, to: Date | null}, i: number, i2: number){

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

    
    let index = Number.parseInt(parent.parentElement!.id.at(-3)!)


    parent.parentElement?.parentElement?.firstElementChild?.classList.remove("visible")
    parent.parentElement?.parentElement?.lastElementChild?.classList.remove("visible")

    //parent.classList.add("chosenTime")

    if(parent.firstChild !== null){
      let temp = parent.firstChild as HTMLButtonElement
      //temp.classList.remove("whiteHover")
      this.tripTimes[0][index] = fromTo
      this.tripTimeCalc()
      this.addedStations[0][i].chosen = i2
    }

    let nextSib = parent.nextElementSibling
    while(nextSib !== null){
      //nextSib.classList.add("displayNone")
      nextSib = nextSib.nextElementSibling
    }
    let prevSib = parent.previousElementSibling
    while(prevSib !== null){
      //prevSib.classList.add("displayNone")
      prevSib = prevSib.previousElementSibling
    }
  }

  tripTimeCalc(){
    while(this.tripTimes[0].length > this.tripTimesMS[0].length)
      this.tripTimesMS[0].push(null)
    while(this.tripTimes[0].length < this.tripTimesMS[0].length)
      this.tripTimesMS[0].pop()

    if(this.tripTimes[0][0]){

      let now = Date.now()
      let ms = this.tripTimes[0][0]!.from.getTime() - now
      if(ms < 0){
        this.tripTimesMSFirst[0] = of(-999)
      }
      else
        this.tripTimesMSFirst[0] = timer(0, 1000).pipe(
          map(n => (ms/1000 - n) * 1000),
          takeWhile(n => n >= -1001),
        );
    }
    else{
      this.tripTimesMSFirst[0] = new Observable
    }
    for (let index = 0; index + 1 < this.tripTimes[0].length; index++) {
      if(this.tripTimes[0][index] && this.tripTimes[0][index + 1]){
        let start = this.tripTimes[0][index]!.to
        let end = this.tripTimes[0][index + 1]!.from


        if(start){
          this.tripTimesMS[0][index + 1] = end.getTime() - start.getTime()
        }
      }
      else{
        this.tripTimesMS[0][index + 1] = null
      }
    }
    this.tripTimesStartToEnd[0]= null
    if(this.addedStations.length > 0)
      if(this.tripTimes[0][0] && this.tripTimes[0][this.addedStations[0].length - 1]){
        if(this.tripTimes[0][this.addedStations[0].length - 1]!.to)
          this.tripTimesStartToEnd[0] = this.tripTimes[0][this.addedStations[0].length - 1]!.to!.getTime() - this.tripTimes[0][0].from.getTime()
      }

  }

  tripTimeCalcFromDelete(index: number){
    this.tripTimes[0].splice(index, 1)
    this.tripTimeCalc()
  }
  tripTimeCalcNull(index: number){
    this.tripTimes[0][index] = null
    this.tripTimeCalc()
  }

  switchStations(startStation: Station, endStation: Station, index:number){

    
    let id = startStation.siteID + endStation.siteID + index


    this.addedStations[0][index].one = endStation
    this.addedStations[0][index].two = startStation

    
    let listUL = (document.getElementById(id + "ul") as HTMLUListElement)
    let select = (document.getElementById(id) as HTMLSelectElement)

    let newID = endStation.siteID + startStation.siteID + index

    listUL.id = newID
    select.id = newID

  }

  deleteStations(index:number){
    this.addedStations[0].splice(index, 1)
  }
  
  saveRoute(){
    this.addRoute()
    
  }

  getRoute(index: number){

    
    
    let tempAS = this.addedStations[index]
    let tempTT = this.tripTimes[index]
    let tempTTMS = this.tripTimesMS[index]
    let tempTTMSF = this.tripTimesMSFirst[index]
    let tempTTSTE = this.tripTimesStartToEnd[index]

    this.addedStations.splice(index, 1)
    this.tripTimes.splice(index, 1)
    this.tripTimesMS.splice(index, 1)
    this.tripTimesMSFirst.splice(index, 1)
    this.tripTimesStartToEnd.splice(index, 1)
    
    this.addedStations.unshift(tempAS)
    this.tripTimes.unshift(tempTT)
    this.tripTimesMS.unshift(tempTTMS)
    this.tripTimesMSFirst.unshift(tempTTMSF)
    this.tripTimesStartToEnd.unshift(tempTTSTE)

  }

  addRoute(){
    let i = this.addedStations.push([]) - 1
    this.tripTimes.push([])
    this.tripTimesMS.push([])
    this.tripTimesMSFirst.push(new Observable)
    this.tripTimesStartToEnd.push(null)

    this.getRoute(i)
  }

  deleteRoute(){
    this.addedStations.shift()
    this.tripTimes.shift()
    this.tripTimesMS.shift()
    this.tripTimesMSFirst.shift()
    this.tripTimesStartToEnd.shift()
  }

  sortRoutes(value: string){
    
    for (let i = 0; i < this.addedStations.length; i++) {
      let tempI = i
      let compAlt = undefined
      let comp = this.tripTimesStartToEnd[i]
      if(value === "Arrival"){
        compAlt = this.tripTimes[i].at(-1)?.to?.getTime()
        if(compAlt !== undefined && this.tripTimes[i].length === this.addedStations[i].length)
          comp = compAlt
        else
          comp = null
      }
      if(comp === null)
        comp = Number.MAX_SAFE_INTEGER
      
      for(let j = i - 1; j >= 0; j--){
        let prevCompAlt = undefined
        let prevComp = this.tripTimesStartToEnd[j]
        if(value === "Arrival"){
          prevCompAlt = this.tripTimes[j].at(-1)?.to?.getTime()
          if(prevCompAlt !== undefined)
            prevComp = prevCompAlt
          else
            prevComp = null
        }
        
        if(prevComp === null)
          prevComp = Number.MAX_SAFE_INTEGER
        if(comp < prevComp){
          this.switchRoutes(tempI, j)
          tempI = j
        }
        else
          break
      }
    }
  }

  switchRoutes(indexFirst: number, indexSecond: number){
    [this.addedStations[indexFirst], this.addedStations[indexSecond]] = [this.addedStations[indexSecond], this.addedStations[indexFirst]];
    [this.tripTimes[indexFirst], this.tripTimes[indexSecond]] = [this.tripTimes[indexSecond], this.tripTimes[indexFirst]];
    [this.tripTimesMS[indexFirst], this.tripTimesMS[indexSecond]] = [this.tripTimesMS[indexSecond], this.tripTimesMS[indexFirst]];
    [this.tripTimesMSFirst[indexFirst], this.tripTimesMSFirst[indexSecond]] = [this.tripTimesMSFirst[indexSecond], this.tripTimesMSFirst[indexFirst]];
    [this.tripTimesStartToEnd[indexFirst], this.tripTimesStartToEnd[indexSecond]] = [this.tripTimesStartToEnd[indexSecond], this.tripTimesStartToEnd[indexFirst]];
  }

  showRoutes(){

    let button = document.getElementById("routes_menu")

    if(button === null)
      return

    let con = document.getElementsByClassName("routesContainer")[0]

    if(button.innerText === "Show Routes"){
      button.innerText = "Hide Routes"
      con.classList.add("visible")
    }
    else{
      button.innerText = "Show Routes"
      con.classList.remove("visible")
    }


  }

  

  previousTouch: Touch | null = null

  addedEventListeners: string[] = []

  tripTimesMSFirst: Array<Observable<number>> = []
  tripTimesMS: Array<Array<(number | null)>> = [[]]
  tripTimes: Array<Array<({from: Date, to:Date | null} | null)>> = [[]]
  tripTimesStartToEnd: Array<number | null> = []

  addedStations: Array<Array<StationPair>> = [[]]
  stationPair: StationPairNull = {one: null,two: null}

  private StationsReal: {[station: string]:Departures} = {}
  private StationsRealTime: {[station: string]:number} = {}
  private lastCallRealTime: {[station: string]:number} = {}

  stationTimes: {diffTime: number,
    journeyNumber: number,
    journeyDirection: number,
    lineNumber: string,
  }[]= []

  stations = []
  station: string = ""

  queryStation: string[] = []
  queryStationName: string[] = []

  travelModes = ["bus", "metro", "train", "tram", "ship"]
}
