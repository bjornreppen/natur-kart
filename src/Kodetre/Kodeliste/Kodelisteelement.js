// @flow
import {
  Avatar,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core'
import React from 'react'
import språk from '../../språk'
import Bildeavatar from './Bildeavatar'
import VolumIndikator from './VolumIndikator'
//import Arealbruksintensitet from './Filter/Arealbruksintensitet'
type State = {}

type Props = {
  kode: string,
  visKode: Boolean,
  meta: Object,
  størsteAreal: number,
  areal: number,
  onMouseLeave: Function,
  onMouseEnter: Function,
  onChange: Function,
  onGoToCode: Function,
  erOpplyst: Boolean,
  utenFarge: Boolean,
}

class Kodelisteelement extends React.Component<Props, State> {
  shouldComponentUpdate(np) {
    if (np.areal !== this.props.areal) return true
    if (np.value !== this.props.value) return true
    return false
  }

  render() {
    const {
      meta,
      kode,
      erOpplyst,
      visKode,
      onGoToCode,
      onMouseEnter,
      onMouseLeave,
      areal,
      størsteAreal,
      utenFarge,
      onChange,
    } = this.props
    return (
      <React.Fragment>
        <ListItem
          dense={true}
          key={kode}
          onClick={() => onGoToCode(kode)}
          onMouseEnter={() => onMouseEnter && onMouseEnter(kode)}
          onMouseLeave={() => onMouseLeave && onMouseLeave(kode)}
          button={true}
        >
          <VolumIndikator størsteAreal={størsteAreal} areal={areal} />
          <Bildeavatar kode={kode} />
          {!utenFarge && (
            <ListItemSecondaryAction style={{ paddingRight: 8 }}>
              <Avatar
                style={{
                  width: 24,
                  height: 24,
                  filter: 'drop-shadow(1px 1px 1px #666)',
                  backgroundColor: erOpplyst ? '#f00' : meta.farge,
                }}
              />
            </ListItemSecondaryAction>
          )}
          <ListItemText
            primary={språk(meta.tittel)}
            secondary={visKode && kode.substring(3)}
          />
        </ListItem>
        {/*kode === 'LA-KLG-AI' && (
          <ListItem>
            <Arealbruksintensitet value={meta.value} onChange={onChange} />
          </ListItem>
        )*/}
      </React.Fragment>
    )
  }
}

export default Kodelisteelement
