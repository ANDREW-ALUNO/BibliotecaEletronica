import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ImageBackground, Image, Platform, ToastAndroid, Alert, KeyboardAvoidingView } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import *as Permissions from 'expo-permissions'
import Db from "../config"
import firebase from "firebase";
const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class Transaction extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      bookId: "",
      studentId: "",
      bookName: "",
      studentName: ""
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
  handleBarcodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true
      });
    }

  }
  handleTransaction = async () => {
    var { bookId, studentId } = this.state
    await this.getBookDetails(bookId)
    await this.getStudentDetails(studentId)
    var { bookName, studentName } = this.state
    var transactionType = this.checkBookAvailability(bookId)
    if (!transactionType) {
      if (Platform.OS == 'android') {
        ToastAndroid.show('LIVRO NÃO ENCONTRADO :(', ToastAndroid.SHORT)
      } else {
        Alert.alert('LIVRO NÃO ENCONTRADO :(')

      }
    }
    else if (transactionType == 'issue') {
      var isEligible = this.checkStudentEligibilityForBookIssue(studentId)
      if (isEligible) {
        this.initiateBookIssue(bookId, studentId, bookName, studentName)
        if (Platform.OS == 'android') {
          ToastAndroid.show('LIVRO RETIRADO COM SUCESSO :)', ToastAndroid.SHORT)
        } else {
          Alert.alert('LIVRO RETIRADO COM SUCESSO :)')

        }
      }

    }

    else if (transactionType == "return") {
      var isEligible = this.checkStudentEligibilityForBookReturn(bookId, studentId)
      if (isEligible) {

        this.initiateBookReturn(bookId, studentId, bookName, studentName)
        if (Platform.OS == 'android') {
          ToastAndroid.show('LIVRO DEVOLVIDO', ToastAndroid.SHORT)
        } else {
          Alert.alert('LIVRO DEVOLVIDO')

        }
      }
    }

  }
  getBookDetails = (bookId) => {
    bookId = bookId.toLowerCase().trim()
    Db.collection('books')
      .where('book_id', '==', bookId)
      .get().then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({ bookName: doc.data().book_name })
        })
      })
  }
  checkBookAvailability = async (bookId) => {
    var bookRef = await Db.collection('books')
      .where("book_id", '==', bookId)
      .get()
    var transactionType = ''
    if (bookRef.docs.length == 0) {
      transactionType = false
    } else {
      bookRef.docs.map((doc) => {
        transactionType = doc.data().is_book_available ? 'issue' : 'return'
      })
    }
    return transactionType
  }
  getStudentDetails = studentId => {
    studentId = studentId.trim().toLowerCase();
    Db.collection("students")
      .where("student_id", "==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            studentName: doc.data().student_name
          });
        });
      });
  };
  checkStudentEligibilityForBookIssue = async studentId => {
    const studentRef = await Db
      .collection("students")
      .where("student_id", "==", studentId)
      .get();

    var isStudentEligible = "";
    if (studentRef.docs.length == 0) {
      this.setState({
        bookId: "",
        studentId: ""
      });
      isStudentEligible = false;
      if (Platform.OS == 'android') {
        ToastAndroid.show('ID DO ALUNO NÃO ENCONTRADO', ToastAndroid.SHORT)
      } else {
        Alert.alert('ID DO ALUNO NÃO ENCONTRADO')

      }
    } else {
      studentRef.docs.map(doc => {
        if (doc.data().number_of_books_issued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          if (Platform.OS == 'android') {
            ToastAndroid.show('O ALUNO JA RETIROU DOIS LIVROS!', ToastAndroid.SHORT)
          } else {
            Alert.alert('O ALUNO JA RETIROU DOIS LIVROS!')

          }
          this.setState({
            bookId: "",
            studentId: ""
          });
        }
      });
    }

    return isStudentEligible;
  };
  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    //adicionar uma transação
    Db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue"
    });
    //alterar status do livro
    Db.collection("books")
      .doc(bookId)
      .update({
        is_book_available: false
      });
    // alterar o número de livros retirados pelo aluno
    Db.collection("students")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(1)
      });

    // atualizando estado local
    this.setState({
      bookId: "",
      studentId: ""
    });
  };
  checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
    const transactionRef = await Db
      .collection("transactions")
      .where("book_id", "==", bookId)
      .limit(1)
      .get();
    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.student_id === studentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        if (Platform.OS == 'android') {
          ToastAndroid.show('O LIVRO NÃO FOI RETIRADO POR ESTE ALUNO', ToastAndroid.SHORT)
        } else {
          Alert.alert('O LIVRO NÃO FOI RETIRADO POR ESTE ALUNO')

        }
        this.setState({
          bookId: "",
          studentId: ""
        });
      }
    });
    return isStudentEligible;
  };

  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    // adicionar uma transação
    Db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return"
    });
    // alterar status do livro
    Db.collection("books")
      .doc(bookId)
      .update({
        is_book_available: true
      });
    // alterar o número de livros retirados pelo aluno
    Db.collection("students")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
      });

    // atualizando estado local
    this.setState({
      bookId: "",
      studentId: ""
    });
  };
  render() {
    const { domState, scanned, bookId, studentId, hasCameraPermissions } = this.state
    if (domState != 'normal') {
      return (
        <BarCodeScanner onBarCodeScanned={scanned ? undefined : this.handleBarcodeScanned} style={StyleSheet.absoluteFillObject} />
      )
    }
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText={(text) => { this.setState({ bookId: text.toLowerCase().trim() }) }}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Estudante"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText={(text) => { this.setState({ studentId: text.toLowerCase().trim() }) }}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, { marginTop: 25 }]}
              onPress={this.handleTransaction}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  appName: {
    width: 180,
    resizeMode: "contain"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold"
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
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Rajdhani_600SemiBold"
  }
});
