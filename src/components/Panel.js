import React from 'react'
import { withStyles } from '@material-ui/core'
import classNames from 'classnames'

const styles = {
  rot: {
    height: '100vh',
    overflowY: 'auto',
  },
  padTop: { paddingTop: 55 },
}

const Panel = ({ padTop, classes, style, children }) => (
  <div className={classNames(classes.rot, padTop && classes.padTop)}>
    <div
      style={{
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  </div>
)

export default withStyles(styles)(Panel)
