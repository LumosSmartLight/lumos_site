import React, { Component } from 'react';

import logo from '../src/lumos.png';
import sun from '../src/sun.png';
import cloud from '../src/cloud.png';
import snowflake from '../src/snowflake.png';
import dry from '../src/dry.png';
import humid from '../src/humid.png';

import './App.css';
import firebase from 'firebase'
import { config } from './config/firebase'

import Slider from 'material-ui/Slider';
import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import { Card } from 'material-ui';
import { Line } from 'react-chartjs-2'
import { HuePicker } from 'react-color'
import moment from 'moment'

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      temperature: 0,
      humidity: 0,
      intensity: 0,
      mode: 1,
      isToggled: true,
      colors: {
          r: 0,
          g: 0,
          b: 255
      },
      isLoaded: false,
    }
  }

  

  componentWillMount() {
    firebase.initializeApp(config)
    firebase.database().ref('config').once('value', (snap) => {
      let v =  snap.val()
      console.log(v)
      this.setState({
        temperature: 0,
        humidity: 0,
        intensity : parseInt(100 * v.intensity / 1024),
        mode: v.mode,
        isToggled : Boolean(v.ison), 
        colors: {
          r: v.colors.r,
          g: v.colors.g,
          b: v.colors.b
        },
        isLoaded: true
      })
    })
    firebase.database().ref('temperature').once('value', (snap) => {
      this.setState({temperature: snap.val()});
    })
    firebase.database().ref('humidity').once('value', (snap) => {
      this.setState({humidity: snap.val()});
    })
  }

  setIntensity = async (value) => {
    value = (value / 100) * 1024
    firebase.database().ref('config/intensity').set(parseInt(value))
  } 

  onIntensitySlide = (e, value) => {
    this.setState({intensity: value})
  }
  
  onIntensitySlideStop = () => {
    this.setIntensity(this.state.intensity)
  }

  onSliderPickerStop = (c) => {
    this.setState({colors: c.rgb}, () => {
        firebase.database().ref('config/colors').set(this.state.colors)
    })
  }

  onToggle = (e) => {
    this.setState({ isToggled: !this.state.isToggled }, () => {
      firebase.database().ref('config/ison').transaction((v) => !v)
    })
  }

  onModeChange = (e, v) => {
    this.setState({ mode: v }, () => {
      firebase.database().ref('config/mode').set(v)
    })
  }

  render() {
    const getColor = () => {
        let value = this.state.intensity/100
        //value from 0 to 1
        var hue = ((1 - value) * 120).toString(10);
        return ["hsl(", hue, ", 100%, 45%)"].join("");    
    }

    const getTempColor = () => {
      let value = this.state.temperature
      var hue = (200 - (value * 4.8)).toString(10);
      return ["hsl(", hue, ", 100%, 50%)"].join("");    
    }

    const getHumColor = () => {
      let value = this.state.humidity
      var hue = ((value * 1.3)).toString(10);
      return ["hsl(", hue, ", 100%, 50%)"].join("");    
    }

    const styles = {
      block: {
        maxWidth: 250,
      },
      radioButton: {
        marginBottom: 16,
        marginTop: 24
      },
      toggle: {
        marginBottom: 16,
      },
      tempcard: {
        opacity: this.state.isLoaded ? 1 : 0,
        maxWidth: '100%',
        display: 'inline-block'
      },
      humcard: {
        opacity: this.state.isLoaded ? 1 : 0,
        maxWidth: '100%',
        marginBottom: 36,
        display: 'inline-block'
      }
    };

    return (
      <div className="App">
        <header className="App-header">
          <img className='App-logo' src={logo}/>
        </header>

        <Card className='card' style={{opacity: this.state.isLoaded ? 1 : 0}}>
          <div className='slider-container'>
            <h1 style={{ textAlign: 'left', fontSize: 22 }}> Intensity <span className='intensity' style={{ color: getColor() }}> {parseInt(this.state.intensity)}% </span>
              <Toggle className='toggleOnOff'
                style={styles.toggle}
                toggled={this.state.isToggled}
                defaultToggled={true}
                onToggle={this.onToggle}
              />
            </h1>
            <Slider name="intensity" step={1} min={0} max={100} value={this.state.intensity} onChange={this.onIntensitySlide} onDragStop={this.onIntensitySlideStop} />

            <h1 style={{ textAlign: 'left', fontSize: 22 }}> RGB </h1>
            <HuePicker width={'100%'} onChangeComplete={this.onSliderPickerStop} color={this.state.colors} />

            <RadioButtonGroup name="lightmode" defaultSelected={this.state.mode} valueSelected={this.state.mode} onChange={this.onModeChange}>
              <RadioButton
                value={0}
                label="Manual"
                style={styles.radioButton}
              />
              <RadioButton
                value={1}
                label="Auto"
                style={styles.radioButton}
              />
              {/* <RadioButton
                value={2}
                label="Modo Dormir"
                style={styles.radioButton}
              /> */}
            </RadioButtonGroup>
          </div>
        </Card>
        
        <Card className='card-temp' style={styles.tempcard}>
          <h1 style={{ textAlign: 'center', fontSize: 22 }}> 
            Temperature <br/>
            <span className='temperature' 
              style={{ color: getTempColor(), textAlign: 'center', fontSize: 36}}> 
              {this.state.temperature}ºC <br/>
              {this.state.temperature >= 24 ? 
                <img className='temp-img-sun' style={{height: '30%', width: '30%', marginTop: 16}} src={sun}/> : ''}
              {this.state.temperature < 24 && this.state.temperature >= 16 ? 
                <img className='temp-img-cloud' style={{height: '30%', width: '30%', marginTop: 16}} src={cloud}/> : ''}
              {this.state.temperature < 16 ? 
              <img className='temp-img-snow' style={{height: '30%', width: '30%', marginTop: 16}} src={snowflake}/> : ''}
            </span>
          </h1>
        </Card>
        <Card className='card-hum' style={styles.humcard}>
          <h1 style={{ textAlign: 'center', fontSize: 22 }}> 
            Humidity<br/>
            <span className='humidity' 
              style={{ color: getHumColor(), textAlign: 'center', fontSize: 36}}> 
              {this.state.humidity}% <br/>
              {this.state.humidity >= 60 ? 
                <img className='hum-img' style={{height: '30%', width: '30%', marginTop: 16}} src={humid}/> :
                <img className='hum-img' style={{height: '30%', width: '30%', marginTop: 16}} src={dry}/>}
            </span>
          </h1>
        </Card>
      </div>
    );
  }
}

export default App;
