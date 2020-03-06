import React, { PureComponent } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import { VivViewerLayer, StaticImageLayer } from './layers';

export default class VivViewer extends PureComponent {
  _renderLayers() {
    return [
      new VivViewerLayer({
        id: `VivViewerLayer`,
        ...this.props,
        loader: this.props.zarrLoader
      }),
      new StaticImageLayer({
        id: `StaticImageLayer`,
        ...this.props,
        loader: this.props.staticLoader
      })
    ];
  }

  render() {
    /* eslint-disable react/destructuring-assignment */
    const views = [
      new OrthographicView({
        id: 'ortho',
        controller: true,
        height: this.props.viewHeight,
        width: this.props.viewWidth
      })
    ];
    const { initialViewState } = this.props;
    return (
      <DeckGL
        glOptions={{ webgl2: true }}
        layers={this._renderLayers()}
        initialViewState={initialViewState}
        controller
        views={views}
      />
    );
    /* eslint-disable react/destructuring-assignment */
  }
}
