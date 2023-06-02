import React from "react";
import { View, StyleSheet, Text,TouchableOpacity } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import *as Permissions from 'expo-permissions'
export default class Transaction extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      scannedData: ""
    }
  }
  getCameraPermissions = async (domState) => {
    var { status } = await Permissions.askAsync(Permissions.CAMERA)
    this.setState({
      hasCameraPermissions: status == 'granted',
      domState: domState,
      scanned: false,

    })
  }
  handleBarcodeScanned= async({type,data})=>{
    this.setState({
      scannedData:data,
      domState:'normal',
      scanned:true
    })
    
  }
  render() {
    const{domState,scanned,scannedData,hasCameraPermissions}=this.state
    if(domState == 'scanner'){
      return(
        <BarCodeScanner onBarCodeScanned={scanned?undefined:this.handleBarcodeScanned} style={StyleSheet.absoluteFillObject}/>
      )
    }
    return (
      <View style={styles.container}>
        <Text style={styles.text} >
          {hasCameraPermissions?scannedData:'Solicitar permissão da camera'}
        </Text>
        <TouchableOpacity onPress={()=>this.getCameraPermissions('scanner')} style={styles.button}>
          <Text style={styles.buttonText}>
            Digitalizar QR Code !
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5653D4"
  },
  text: {
    color: "#ffff",
    fontSize: 15
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F48D20",
    borderRadius: 15
  },
  buttonText: {
    fontSize: 15,
    color: "#FFFFFF"
  }
});