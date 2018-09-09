import React from 'react';
import { StyleSheet, Text, Image, View, StatusBar, Animated, Alert, TouchableWithoutFeedback } from 'react-native';
import { COLOR, ThemeProvider, Toolbar } from 'react-native-material-ui';

import Container from './Container';
import { PlayerControls, PlayerControlsShort } from './PlayerControls';
import PlayerMeta from './PlayerMeta';
import Video from 'react-native-video';
import { ReparentableOrigin } from 'rn-reparentable';

import Orientation from 'react-native-orientation';

import config from '../config';

class VideoPlayerControls extends React.Component {

	/* props: {
	
	} */

	state = {
		visible: true
	}

	onControlPress () {

		// Toggle the visiblility if someone clicked the container (unless we've just hit a button)
		if (this.state.visible) {
			this.hideControls();
		} else {
			this.showControls();
		}

	}

	showControls () {
		this.setState({
			visible: true
		})
	}

	timeHideControls () {
		clearTimeout(this.timeToHideControls);
		this.timeToHideControls = setTimeout(this.hideControls.bind(this), 3000);
	}

	hideControls () {
		clearTimeout(this.timeToHideControls);
		this.setState({
			visible: false
		})
	}

	componentWillReceiveProps (nextProps) {

		// Show controls if we're suddenly not playing
		if (nextProps.playerState.playing != this.props.playerState.playing) {
			nextProps.playerState.playing ? this.timeHideControls() : this.showControls();
		}

		// Show controls if we're now buffering
		if (nextProps.playerState.buffering != this.props.playerState.buffering) {
			nextProps.playerState.buffering ? this.showControls() : this.timeHideControls();
		}

	}

	render () {

		return (
			<TouchableWithoutFeedback onPressOut={ () => this.onControlPress() } style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
				<View
					style={{ opacity: this.state.visible ? 1 : 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
					<View pointerEvents={ this.state.visible ? 'auto' : 'none' }>
						<PlayerControlsShort { ...this.props } />
					</View>
				</View>
			</TouchableWithoutFeedback>
		)

	}

}

/*
 * PlayerWrap ensures that a Video and PlayerControls pair remain in sync and can share their state
 * Why this doesn't already exist somewhere in the react-niverse I have no effing idea... :^) 
 * *forgets that comments go up on github and are public record forever* :s
 */
class PlayerWrap extends React.Component {

	state = {
		playerState: {
			playing: false,
			buffering: true,
			paused: false
		}
	}

	setPlayer (player) {

		if (this.state.player != null) {
			return;
		}

		this.setState({
			player: player
		})

	}

	setControls (controls) {

		if (this.state.controls != null) {
			return;
		}

		this.setState({
			controls: controls
		})

	}

	setPlayerState (playerState) {
		this.setState({
			playerState: Object.assign({}, this.state.playerState, playerState)
		})
	}

	onEvent (event, payload) {

		switch (event) {
			case 'onBuffer':
				this.setPlayerState({ playing: false, buffering: true })
				break;
			case 'onError':
				this.setPlayerState({ playing: false, buffering: false })
				break;
			case 'onLoad':
				this.setPlayerState({ playing: true })
				break;
			case 'onLoadStart':
				this.setPlayerState({ playing: false, buffering: true })
				break;
			case 'onProgress':
				this.setPlayerState({ playing: true, buffering: false })
				break;
			case 'onEnd':
				this.setPlayerState({ playing: false, buffering: false })
				break;


			case 'onPressPlay':
				// if we're buffering and we hit play, we should try and buffer again because it's pribably frozen. to-do
				if (this.state.playerState.paused) {
					this.setPlayerState({ paused: false, playing: true })
				} else {
					this.setPlayerState({ paused: true, playing: false })
				}
				break;

			case 'onPressStop':
				this.props.onStop();
				break;
		}

	}

	render () {

		let view = {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		}

		return (
			<View style={ view }>
				<Video
					videoStyle={{ height: this.props.height }}
					style={{ height: this.props.height }}
					source={ this.props.source }
					poster="https://insanityradio.com/res/slate.png"
					ref={ (a) => this.setPlayer(a) }

					playInBackground={ false }
					paused={ this.state.playerState.paused }
					resizeMode="contain"
					playWhenInactive={ true }

					onBuffer={ (a) => this.onEvent('onBuffer', a) }
					onError={ (a) => this.onEvent('onError', a) }

					onLoad={ (a) => this.onEvent('onLoad', a) }
					onProgress={ (a) => this.onEvent('onProgress', a) }
					onLoadStart={ (a) => this.onEvent('onLoadStart', a) }

					onEnd={ (a) => this.onEvent('onEnd', a) } />

				<VideoPlayerControls
					playerState={ this.state.playerState }
					onPlay={ (a) => this.onEvent('onPressPlay', a) }
					onStop={ (a) => this.onEvent('onPressStop', a) } />

			</View>
		)

	}

}

export default class PlayerMain extends React.Component {

	state = {
		video: false
	}

	constructor () {
		super();
		this.URL = config.getURLForVideo();
	}

	loadVideo () {
		Alert.alert(
			'Warning',
			"Video is only currently available in HD. This won't work unless you're on fast 4G or Wi-Fi. If on 4G, unless you're on an unlimited data plan, this will use a very large chunk of your allowance.",
			[
				{ text: 'Cancel', onPress: () => this.stopVideo(), style: 'cancel' },
				{ text: 'Watch', onPress: () => this.setState({ video: true })}
			],
			{ cancelable: true }
		)
	}

	stopVideo () {
		this.setState({ video: false });
	}

	componentWillUpdate (newProps, newState) {

		let autoplay = true;

		if (this.props.player && newState.video != this.state.video) {
			newState.video ? this.props.player.stop() : (autoplay && this.props.player.go());
		}

	}

	setPlayer (player) {
		if (this.state.player != null) {
			return;
		}

		this.setState({ player: player })
	}

	renderVideo () {

		let playerState = this.state.playerState;

		return (
			<Animated.View style={{ height: 350, backgroundColor: '#000000' }}>
				<View style={{ height: 286, backgroundColor: '#000000' }}>

					<ReparentableOrigin destination={ this.state.shouldMove ? 'fullscreenInject' : null }>
						<PlayerWrap
							height={ 286 }
							onStop={ () => this.stopVideo() }
							onStateChange={ (state) => this.onVideoStateChange(state) }
							source={{ uri: this.URL }} />
					</ReparentableOrigin>

				</View>
				<PlayerMeta { ...this.props } />
				<Text></Text>
			</Animated.View>
		)

	}

	render () {

		if (this.state.video) {
			return this.renderVideo();
		}

		return (
			<Animated.View>
				<PlayerControls
					style={ this.props.styles.controls }
					loadVideo={ this.loadVideo.bind(this) }
					{ ...this.props } />
				<PlayerMeta { ...this.props } />
			</Animated.View>
		);
	}

}
