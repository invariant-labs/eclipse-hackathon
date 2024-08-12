import { makeStyles } from 'tss-react/mui'
import { colors, typography } from '@static/theme'

const useStyles = makeStyles()(() => {
  return {
    tooltip: {
      color: colors.invariant.textGrey,
      ...typography.caption4,
      lineHeight: '24px',
      background: colors.black.full,
      borderRadius: 12,
      width: 80,
      textAlign: 'center',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
      top: -30
    }
  }
})

export default useStyles
