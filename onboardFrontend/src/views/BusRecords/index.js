import React, { Fragment, Component } from 'react'
import axios from 'axios';

import { Link, Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup, faFile, faList, faL } from '@fortawesome/free-solid-svg-icons'
import { getLogs, getVehicleRecords, addVehicle, addMultipleVehicles } from '../../services/agent'
import { 
    Card, 
    Spinner,
    Table
} from 'reactstrap'
import toast from 'react-hot-toast'
import { statusCode } from '../../utility/constants/utilObject'
import { showErrorToast, toastStyle } from '../../utility/helper'
import { Edit3, Plus, Search, Square, Trash, Trash2 } from "react-feather"
import "./index.css"
import { 
    Button, 
    Modal, 
    ModalHeader, 
    ModalBody, 
    ModalFooter 
  } from "reactstrap";
import moment from "moment";
import { userStatus } from '../../utility/constants/options'
import CustomDropdown from '../../component/CustomDropdown'
import CustomInputBox from '../../component/CustomInputBox'
import { use } from 'i18next'
import { Eye, Edit, XSquare} from "react-feather"
import BarLoader from "react-spinners/BarLoader";
import Pagination from "react-js-pagination";
import Excel from 'exceljs';
import Papa from "papaparse";


const override = {
    borderColor: "#1761fd",
    width: '100%'
  };
 
class BusRecords extends Component {
    constructor(props) {
      super(props)
      this.state = {
        vehicleList: [],
        userListOrg: [],
        loader: true,
        searchFilter: "",
        selectedUserForDocument: null,
        showModePopup: false,
        showDeletePopup:false,
        type: "",
        status: "",
        email: "",
        filterByText: '',
        viewTokenDetails: [],
        tokenDetails: [],
        loading: [],
        updateToken: [],
        months: [],
        credits: [],
        updating: [],
        activePage: 1,
        totalItemsCount: 0,
        pageRangeDisplayed: 10,
        itemsCountPerPage: 12,
        vehicleType:[],
        newVehicleInfo:{}
      }
    }

    componentDidMount = () => {
        this.getBusRecords()
    }


    getBusRecords = () => {
        this.setState({loader: true})
        const queryParams = `?page=${this.state.activePage}&records=${this.state.itemsCountPerPage}` 
        getVehicleRecords(queryParams)
        .then((res)=>{
            if(res.status == statusCode.HTTP_200_OK){
                let vehicles = res.data.data.vehicles;
                let vehicleType = res.data.data.vehicleType;
                console.log(vehicleType)
          vehicleType = vehicleType.map((v) => {
          //  console.log(v.vehicleType)
                    return({
                        label:v.name,
                        value: v.vehicleTypeId
                    })
                })
                this.setState({
                    totalItemsCount: vehicles.count,
                    vehicleList: vehicles.rows,
                    vehicleTypes : vehicleType,
                    loader: false,
                })
            }else{
                toast.error(res.message, {...toastStyle.error});
                this.setState({loader: false, vehicleList: [], userListOrg : []})
            }
        })
        .catch((err)=>{
            toast.error(err?.message, {...toastStyle.error});
            this.setState({loader: false, vehicleList: [], userListOrg : []})
        })
    }
    
    handlePageChange(pageNumber) {
        console.log(`active page is ${pageNumber}`);
        this.setState({activePage: pageNumber}, ()=>{});
    }

   
    showPopup = () => {
        this.setState({showModePopup: true })
    }

    hidePopup = () => {
        this.setState({showModePopup: false,newVehicleInfo:{},showDeletePopup:false})
    }

   
    addVehicle = (isActive=true) =>{
        let newVehicleInfo = this.state.newVehicleInfo
        if(!newVehicleInfo.number || !newVehicleInfo.module || !newVehicleInfo.type){
            toast.error('Please fill all the mandatory fields!!')
            return
        }

        this.setState({loader:true})

        let payload = {
            vehicleNo : newVehicleInfo.number,
            vehicleModule : newVehicleInfo.module,
            vehicleType : newVehicleInfo.type.value
        }

        if(newVehicleInfo.id){
            payload = {
                ...payload,
                vehicleId : newVehicleInfo.id,
                isActive : isActive
            }
        }

        addVehicle(payload)
        .then((res)=>{
            if(res.status == statusCode.HTTP_200_OK){
                let vehicles = res.data.data;
                this.setState({
                    totalItemsCount: vehicles.count,
                    vehicleList: vehicles.rows,
                    loader: false,
                    showModePopup:false,
                    showDeletePopup:false,
                    newVehicleInfo: {}
                })
            }else{
                toast.error(res.message, {...toastStyle.error});
                this.setState({loader: false})
            }
        })
        .catch((err)=>{
            toast.error(err?.message, {...toastStyle.error});
            this.setState({loader: false})
        })
    }

    addVehicles = (payload) =>{
        addMultipleVehicles({ vehicles :payload})
        .then((res)=>{
            if(res.status == statusCode.HTTP_200_OK){
               // console.log(payload);
               console.log(payload);

                let vehicles = res.data.data;
                this.setState({
                    totalItemsCount: vehicles.count,
                    vehicleList: vehicles.rows,
                    loader: false,
                    showModePopup:false,
                    showDeletePopup:false,
                    newVehicleInfo: {}
                })
                toast.success("Records updated successfully!!")
            }else{
                toast.error(res.message, {...toastStyle.error});
                this.setState({loader: false})
            }
        })
        .catch((err)=>{
            toast.error(err?.message, {...toastStyle.error});
            this.setState({loader: false})
        })
    }

      /*Api calling function here  */
    // fetchVehicleFromAPI = () => {
    //     this.setState({ loader: true });
    
    //     const apiEndpoint = 'http://localhost:5000/api/products'; {/*Api Link here */}
    

    //     axios.get(apiEndpoint)
    //         .then((response) => {
            
    //             const vehicleData = response.data;
    
    //             if (vehicleData && vehicleData.vehicleNo && vehicleData.vehicleModule && vehicleData.vehicleType) {
    //                 const payload = {
    //                     vehicleModule: vehicleData.vehicleModule,
    //                     vehicleNo: vehicleData.vehicleNo,
    //                     vehicleType: vehicleData.vehicleType,
    //                 };
    
    //                 // Add the fetched vehicle record
    //                 this.addVehicleFromAPI(payload);
    //             } else {
    //                 toast.error('Invalid vehicle data received from API');
    //                 this.setState({ loader: false });
    //             }
    //         })
    //         .catch((error) => {
    //             // Handle errors
    //             console.error('Error fetching vehicle data from API:', error);
    //             toast.error('Failed to fetch vehicle data from API');
    //             this.setState({ loader: false });
    //         });
    // };
    
    // addVehicleFromAPI = (payload) => {
    //     addVehicle(payload)
    //         .then((res) => {
    //             if (res.status === statusCode.HTTP_200_OK) {
    //                 // Vehicle added successfully
    //                 const vehicles = res.data.data;
    //                 this.setState({
    //                     totalItemsCount: vehicles.count,
    //                     vehicleList: vehicles.rows,
    //                     loader: false,
    //                     showModePopup: false,
    //                     showDeletePopup: false,
    //                     newVehicleInfo: {},
    //                 });
    //                 toast.success('Vehicle record added successfully');
    //             } else {
    //                 // Handle error response
    //                 toast.error(res.message, { ...toastStyle.error });
    //                 this.setState({ loader: false });
    //             }
    //         })
    //         .catch((err) => {
    //             // Handle errors
    //             toast.error(err?.message, { ...toastStyle.error });
    //             this.setState({ loader: false });
    //         });
    // };
    /*handling file records csv */
    _handleFileLoad = async(e) => {
        const file = e.target.files[0];
        const extension = file.name.split('.').pop().toLowerCase();
        this.setState({loader:true})
        let params = [];
        if(extension == 'csv'){
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            dynamicTyping: true,

            complete: (results) => {
                params = results.data;
                console.log("Parsed Data:", params);
                if(params.length>0){
                    //params.splice(0,1)
                    this.addVehicles(params)
                    if (!params[0]?.hasOwnProperty("MODULE NUMBER")) {
                        this.setState({loader:false});
                        showErrorToast("CSV file is missing 'MODULE NUMBER' column.");
                        return;
                    }
                    if (params[0].hasOwnProperty("MODULE NUMBER")) {
                        // this.setState({loader:false});
                        // showErrorToast("CSV file is missing 'MODULE NUMBER' column.");
                        console.log("dd")
                        return;}
                    // Extract values from "MODULE NUMBER" column
                    const moduleNumbers = params.map(row => row["MODULE NUMBER"]);
                    console.log('Module Numbers:', moduleNumbers);
                }
                if(params.length>2000){
                    this.setState({loader:false})
                    showErrorToast("Upto 2000 records can be added in one go!!")
                    return;
                }
                console.log('-----------',params);
            },
          });
        }else if (extension === 'xlsx') {
            const wb = new Excel.Workbook();
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
        
            reader.onload = () => {
                const buffer = reader.result;
                wb.xlsx.load(buffer).then((workbook) => {
                    const params = [];
        
                    workbook.eachSheet((sheet, id) => {
                        sheet.eachRow((row, rowIndex) => {
                            // Skip the header row (assuming it's the first row)
                            if (rowIndex !== 1) {
                                let rowData = [...row.values];
                                // Remove the first element if it's not needed
                                rowData.splice(0, 1);
                                params.push(rowData);
                            }
                        });
                    });
        
                    if (params.length > 2000) {
                        this.setState({ loader: false });
                        showErrorToast("Up to 2000 records can be added in one go!!");
                        return;
                    }
        
                    console.log("Parsed Data:", params);
                
                        this.addVehicles(params)
                        toast("Added");
                    //  console.log('-----------',params);
                  });
          };
        }else{
            this.setState({loader:false})
          showErrorToast("We are accepting only csv/xlsx file!")
        }
    }


    renderModePopup = () => {
        if(this.state.showModePopup){
            return (
                <Modal size='sm' isOpen={this.state.showModePopup} style={{marginTop: '5%'}}>
                <ModalHeader>Add Bus</ModalHeader>
                <ModalBody>
                
                <CustomInputBox
                    label="Vehicle Number"
                    mandatory={true}
                    //smallBoxEnabled={true}
                    //info={"VEHICLE ID"}
                    onChange={(text)=>{this.setState({newVehicleInfo : {...this.state.newVehicleInfo,number:text}})}}
                    value={this.state.newVehicleInfo?.number || ''}
                    charCount={false}
                    size={"md"}                    
                    placeholderText="Input the vehicle id"
                    maxLength={300}
                    //note="Provide a blog topic that will determine the main theme of the blog"
                />                
                <CustomInputBox
                    label="Module Number"
                    //smallBoxEnabled={true}
                    mandatory={true}
                    //info={"Capture what you want this blog to achieve or for what target audience is this being written for. <br/>For example: to encourage working professionals to try meditation as a tool for stress relief, <br/> to promote organic farming, to motivate parents to take mental health seriously."}
                    onChange={(text)=>{this.setState({newVehicleInfo : {...this.state.newVehicleInfo,module:text}})}}
                    value={this.state.newVehicleInfo?.module || ''}
                    charCount={false}
                    size={"md"}
                    placeholderText="Input the vehicle number"
                    maxLength={300}
                    //note="Provide information about the blog's goal or objective"
                />

                <CustomDropdown
                  label="Vehicle Type"
                  mandatory={true}
                  optionHandler={(text)=>{this.setState({newVehicleInfo : {...this.state.newVehicleInfo,type:text}})}}
                  value={this.state.newVehicleInfo?.type || 'Bus'}
                  options={this.state.vehicleType}
                  size={"md"}                  
                  placeholderText="Input the vehicle type"
                />
                
                </ModalBody>
                <ModalFooter>                   
                    <button onClick={()=>{this.addVehicle()}} className="btn btn-md btn-primary"> Add</button>
                    <button onClick={()=>{this.hidePopup()}} className='btn btn-md btn-secondary' >Cancel</button>
                </ModalFooter>
            </Modal>
            )
        }
    }
    renderDeletePopup = () => {
        if(this.state.showDeletePopup){
            return (
                <Modal size='sm' isOpen={this.state.showDeletePopup} style={{marginTop: '5%'}}>
                <ModalHeader>Delete Vehicle Record</ModalHeader>
                <ModalBody>
                <span>Are you sure you want to delete the records for vehicle number {this.state.newVehicleInfo.number}</span>
                </ModalBody>
                <ModalFooter>                   
                    <button onClick={()=>{this.addVehicle(false)}} className="btn btn-md bg-danger text-white"> Confirm</button>
                    <button onClick={()=>{this.hidePopup()}} className='btn btn-md btn-secondary' >Cancel</button>
                </ModalFooter>
            </Modal>
            )
        }
    }


    handlerEvent = (index, event) => {
        let name = event.target.name;
        let value = parseInt(event.target.value);
        if(!value){
            this.state[name][index] = "";
            this.setState({name : this.state[name]})
        }else{
            this.state[name][index] = value;
            this.setState({name : this.state[name]})
        }
    }
 
    onEditClick = (vehicle)=>{
        this.setState({
            newVehicleInfo:{
                number : vehicle.vehicleNo,
                module : vehicle.vehicleModule,
                type : {value:vehicle.vehicleType, label : vehicle.VehicleType.name},
                id : vehicle.vehicleId
            },
            showModePopup:true
        })
    }

    onDeleteClick = (vehicle)=>{
        this.setState({
            newVehicleInfo:{
                number : vehicle.vehicleNo,
                module : vehicle.vehicleModule,
                type : {value:vehicle.vehicleType, label : vehicle.VehicleType.name},
                id : vehicle.vehicleId
            },
            showDeletePopup:true
        })
    }

   renderVehicles = () => {
    const vehicleList = [];
    this.state.vehicleList.forEach((vehicle, index) => {
        console.log(vehicle,vehicle.vehicleModule);
        let date = new Date(vehicle.created_at);
        vehicleList.push(
            <tr key={index}> {/* Assign a unique key */}
                <th scope="row" style={{width: '100px'}}>{index+1}</th>
                <td>{vehicle.vehicleNo}</td>
                <td>{vehicle.vehicleModule}</td>
                <td>{vehicle.VehicleType.name}</td>
                <td>
                    <span style={{cursor:'pointer'}} onClick={()=>{this.onEditClick(vehicle)}} ><Edit3 size={20} /></span> &nbsp; <span onClick={()=>{this.onDeleteClick(vehicle)}} style={{cursor:'pointer', color:'blue'}}><Trash2 size={20} /></span> 
                </td>
            </tr>
        );
    });
    return vehicleList;
}
 

    onSearchByString = (text) => {
        let filtered = this.state.userListOrg;
        if(text.trim()){
            //Search By First Name
            filtered = this.state.userListOrg.filter((datum) => datum.first_name.toLowerCase().includes(text.toLowerCase().trim()));
            //Search By Email
            if(filtered.length == 0){
                filtered = this.state.userListOrg.filter((datum) => datum.email.toLowerCase().includes(text.toLowerCase().trim()));
            }
            //Search by Last Name
            if(filtered.length == 0){
                filtered = this.state.userListOrg.filter((datum) => datum.last_name.toLowerCase().includes(text.toLowerCase().trim()));
            }
        }

        if(this.state.status){
            filtered = this.searchByStatus(this.state.status, filtered)
        }

        this.setState({filterByText: text, vehicleList: filtered});
    }

    addRecord = () => {
        this.setState({showModePopup: true})
    }
  
    render() {
      return(
        <Card>
            <BarLoader
                color={"#1761fd"}
                loading={this.state.loader}                        
                size={'100%'}
                cssOverride={override}
                aria-label="Loading Spinner"
                data-testid="loader"
            />
            <div className='container-fluid vh-85'>
                <div className='page-header'>
                    <div className='tab-container' style={{width:'20%'}}>
                        <div className='section-head'>Bus Records</div>
                    </div>
                    <div className='row'>                    
                  {/*  <div className='col-sm-5 text-left'>
                        {/* <input type={'text'} placeholder="Search by Vehicle ID/Number and Type" name='filter' value={this.state.filter} className="form-control" onChange={(e)=>{this.onSearchByString(e.target.value)}} style={{marginTop: '7px'}}></input> 
                      <span>Auto refresh</span>

                    </div>  */}
                    {/* <div className='col-sm-3' style={{textAlign: 'right', marginTop: '12px'}}>
                    <button className='btn btn-sm btn-primary' onClick={this.fetchVehicleFromAPI}>Fetch from API</button>
                    </div>  */}
                   
                    <div className='col-sm-2 text-right' style={{marginTop: '15px', textAlign: 'right'}}>
                        <span> Import File: </span>
                    </div>
                    <div className='col-lg-2' style={{marginTop: '12px'}}>
                        <input 
                            type="file"
                            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            ref={ref=> this.state.fileRef = ref}
                            onChange={this._handleFileLoad}
                        />
                    </div>
                    <div className='col-sm-3' style={{textAlign: 'right', marginTop: '12px'}}>
                        <button className='btn btn-sm btn-primary' onClick={()=>this.addRecord()}>Add Record</button>
                    </div>
                    {/*Adding the button to ftech the data from the api ...... */}
                                            
                    </div>
                </div>
                <div className='page-container no-scroll-bar' >
                        {
                            !this.state.loader?
                            <Table style={{textAlign: 'center'}} bordered>
                            <thead style={{position:'sticky', top:0}}>
                                <tr>
                                    <th>#</th>
                                    <th>Vehicle Number</th>
                                    <th>Module Number</th>
                                    <th>Vehicle Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.renderVehicles()}
                            </tbody>
                            </Table>:
                            <div className="page-sipnner-container">
                                <Spinner size="lg" color="primary" />
                                <div className='page-spinner-text'>
                                    Please wait while we load all users...
                                </div>
                            </div>
                        }
                </div>
                {this.renderModePopup()}
                {this.renderDeletePopup()}
                {/* <div className='row'>
                    <div className='col-lg-12' >
                        <Pagination
                        activePage={this.state.activePage}
                        itemClass="page-item"
                        linkClass="page-link"
                        itemsCountPerPage={this.state.itemsCountPerPage}
                        totalItemsCount={this.state.totalItemsCount}
                        pageRangeDisplayed={this.state.pageRangeDisplayed}
                        onChange={this.handlePageChange.bind(this)}
                        />
                    </div>
                </div> */}
            </div>
        </Card>
      )
    }
  }
  
  export default BusRecords
