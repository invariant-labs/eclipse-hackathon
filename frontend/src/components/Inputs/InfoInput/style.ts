import { Theme } from '@mui/material'
import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  iconsGrid: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    width: 42
  },
  icon: {
    width: 35,
    borderRadius: '100%',

    [theme.breakpoints.down('sm')]: {
      width: 22
    }
  },
  arrowIcon: {
    width: 32,
    marginRight: 8,
    marginLeft: 8,
    height: 32,
    borderRadius: '100%',
    padding: 4,

    [theme.breakpoints.down('sm')]: {
      width: 15,
      marginRight: 2,
      marginLeft: 2
    },
    '&:hover': {
      cursor: 'pointer',
      filter: 'brightness(2)',
      '@media (hover: none)': {
        filter: 'none'
      }
    }
  },
  text: {
    ...typography.body1,
    color: colors.invariant.lightGrey,
    backgroundColor: colors.invariant.component,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    width: '100%'
  },
  rangeGrid: {
    display: 'flex',
    flexDirection: 'row',
    paddingRight: 10
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column'
    }
  },
  headerButtons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'space-between',
      marginTop: 16
    }
  },
  feeText: {
    marginLeft: 12,
    minWidth: 90,

    [theme.breakpoints.down('sm')]: {
      minWidth: 84
    }
  },
  closedText: {
    width: 100,
    paddingRight: 0
  },
  currency: {
    height: 36,
    minWidth: 85,
    flexShrink: 0,
    borderRadius: 11,
    backgroundColor: colors.invariant.light,
    padding: '6px 12px 6px 12px',
    cursor: 'default',

    [theme.breakpoints.down('md')]: {
      height: 36,
      minWidth: 85
    }
  },
  currencyIcon: {
    minWidth: 20,
    height: 20,
    marginRight: 8,
    borderRadius: '100%'
  },
  currencySymbol: {
    ...typography.body3,
    color: colors.white.main
  },
  noCurrencyText: {
    ...typography.body3,
    color: colors.white.main,
    cursor: 'default',
    transform: 'scaleX(2)'
  },
  bottomGrid: {
    background: colors.invariant.component,
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      padding: '16px 8px  16px 8px '
    }
  },
  iconSmall: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: '100%'
  },
  boxInfo: {
    borderRadius: 16,
    position: 'relative',
    '&:not(:last-child)': {
      marginBottom: 26
    }
  },
  title: {
    ...typography.heading4,
    color: colors.invariant.text
  },
  titleValue: {
    ...typography.heading3,
    color: colors.invariant.text,
    fontFamily: 'Mukta'
  },
  violetButton: {
    background: colors.invariant.pinkLinearGradientOpacity,
    borderRadius: 11,
    textTransform: 'none',
    color: colors.invariant.dark,
    width: 116,
    height: 32,
    ...typography.body1,
    '&:hover': {
      background: colors.invariant.pinkLinearGradient,
      boxShadow: '0px 0px 16px rgba(46, 224, 154, 0.35)',
      '@media (hover: none)': {
        background: colors.invariant.pinkLinearGradientOpacity,
        boxShadow: 'none'
      }
    },
    '&:disabled': {
      background: colors.invariant.light,
      color: colors.invariant.dark
    },

    [theme.breakpoints.down('sm')]: {
      ...typography.body1,
      maxHeight: 28,
      minWidth: 105
    }
  },
  tokenGrid: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    '&:not(:last-child)': {
      paddingTop: 24
    }
  },
  tokenArea: {
    backgroundColor: colors.invariant.newDark,
    borderRadius: 16,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    padding: 12,
    '&:not(:last-child)': {
      marginBottom: 8
    }
  },
  tokenAreaUpperPart: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  tokenAreaLowerPart: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16
  },
  token: {
    backgroundColor: colors.invariant.light,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8px 13px',
    minWidth: 'fit-content'
  },
  tokenName: {
    color: colors.white.main,
    ...typography.heading4,
    fontWeight: 400
  },
  tokenValue: {
    overflowX: 'auto',
    overflowY: 'hidden',
    display: 'block',
    whiteSpace: 'nowrap',
    color: colors.invariant.lightGrey,

    '&::-webkit-scrollbar': {
      display: 'none',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    },
    ...typography.heading2
  },
  tokenBalance: {
    color: '#A9B6BF',
    ...typography.caption2,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    flexShrink: 1,
    marginRight: 10
  },
  tokenUSDValue: {
    color: '#A9B6BF',
    ...typography.caption2
  },
  closeButton: {
    color: colors.invariant.dark,
    background: colors.invariant.greenLinearGradientOpacity,
    height: 36,
    width: 116,
    textTransform: 'none',
    transition: '300ms',
    paddingInline: 0,
    borderRadius: 12,
    ...typography.body1,

    '&:hover': {
      background: colors.invariant.greenLinearGradient,
      boxShadow: '0px 0px 16px rgba(46, 224, 154, 0.35)',
      '@media (hover: none)': {
        background: colors.invariant.greenLinearGradientOpacity,
        boxShadow: 'none'
      }
    },

    [theme.breakpoints.down('sm')]: {
      width: '50%',
      ...typography.caption1,
      height: 40
    }
  },
  button: {
    color: colors.invariant.black,
    ...typography.body1,
    textTransform: 'none',
    background: colors.invariant.pinkLinearGradientOpacity,
    borderRadius: 12,
    height: 40,
    width: 130,
    paddingRight: 9,
    paddingLeft: 9,
    letterSpacing: -0.03,

    '&:hover': {
      background: colors.invariant.pinkLinearGradient,
      boxShadow: `0 0 16px ${colors.invariant.pink}`,
      '@media (hover: none)': {
        background: colors.invariant.pinkLinearGradientOpacity,
        boxShadow: 'none'
      }
    },
    [theme.breakpoints.down('sm')]: {
      width: '50%',
      ...typography.caption1
    }
  },
  buttonText: {
    WebkitPaddingBefore: '2px',
    [theme.breakpoints.down('sm')]: {
      WebkitPaddingBefore: 0
    }
  },
  buttons: {
    width: ' 100%',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap'
  },
  iconText: {
    paddingRight: 10,
    paddingBottom: 3,
    width: 19,
    height: 19
  },
  arrowsIcon: {
    width: 32,
    height: 32,
    position: 'absolute',
    top: 'calc(50% - 8px)',
    left: 'calc(50% - 16px)',
    cursor: 'pointer',

    '&:hover': {
      filter: 'brightness(2)',
      '@media (hover: none)': {
        filter: 'none'
      }
    }
  },
  cover: {
    width: '100%',
    height: 'calc(100% - 12px)',
    background: `${colors.invariant.black}dd`,
    position: 'absolute',
    borderRadius: 10,
    zIndex: 1
  },
  loader: {
    height: 50,
    width: 50,
    margin: 'auto'
  },
  loadingBalance: {
    padding: '0 10px 0 20px',
    width: 15,
    height: 15
  },
  active: {
    color: colors.invariant.green,
    outline: `1px solid ${colors.invariant.green}`
  },
  tooltip: {
    color: colors.invariant.textGrey,
    ...typography.caption4,
    lineHeight: '24px',
    background: colors.black.full,
    borderRadius: 12
  },
  arrows: {
    width: 32,
    cursor: 'pointer',

    '&:hover': {
      filter: 'brightness(2)'
    }
  }
}))

export default useStyles
