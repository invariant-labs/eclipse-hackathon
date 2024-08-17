import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => {
  return {
    wrapper: {
      width: 952,
      maxWidth: '100%',
      position: 'relative'
    },
    background: {
      backgroundColor: colors.invariant.component,
      padding: 24,
      paddingTop: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      width: '100%',
      [theme.breakpoints.down('sm')]: {
        padding: '16px 8px  16px 8px '
      }
    },
    tab: {
      color: colors.white.main,
      textTransform: 'initial',
      ...typography.heading4,

      [theme.breakpoints.down('sm')]: {
        fontSize: 18
      }
    },
    row: {
      minWidth: 464,
      // minHeight: 540,
      position: 'relative',
      flexDirection: 'row',

      '& .blurLayer': {
        height: '100%'
      },

      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        minWidth: 0,

        '& .blurInfo': {
          justifyContent: 'flex-start',
          paddingTop: 60
        }
      }
    },

    settingsIconBtn: {
      width: 20,
      height: 20,
      padding: 0,
      margin: 0,
      marginLeft: 10,
      minWidth: 'auto',
      background: 'none',
      '&:hover': {
        backgroundColor: 'none'
      }
    },
    settingsIcon: {
      width: 20,
      height: 20,
      cursor: 'pointer',
      transition: 'filter 100ms',
      '&:hover': {
        filter: 'brightness(1.5)',
        '@media (hover: none)': {
          filter: 'none'
        }
      }
    },
    options: {
      width: 'calc(50% - 12px)',
      marginBottom: 18,
      height: 28,
      display: 'flex',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',

      [theme.breakpoints.down('md')]: {
        width: '100%'
      }
    },
    switch: {
      transition: 'opacity 500ms',
      display: 'flex',
      justifyContent: 'flex-end'
    },
    tabButton: {
      textDecoration: 'none',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flex: '1 1 0',
      padding: '12px 4px',
      borderRadius: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      color: colors.invariant.lightGrey,

      '& p': {
        color: colors.invariant.light,
        transition: 'filter 300ms'
      },
      '&:hover': {
        '& p': {
          filter: 'brightness(1.2)'
        },
        '@media (hover: none)': {
          backgroundColor: colors.invariant.component
        }
      }
    },
    activeTab: {
      backgroundColor: colors.invariant.component,
      '&:hover': {
        backgroundColor: colors.invariant.component
      },
      '& p': {
        color: colors.white.main,
        opacity: 1
      }
    },
    tabsContainer: {
      border: `1px solid ${colors.invariant.component}`,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26
    },
    optionsWrapper: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end'
    },

    tabWrapper: {
      borderBottomRightRadius: 12,
      borderBottomLeftRadius: 12,
      backgroundColor: colors.invariant.component,

      flex: '1 1 0%'
    },
    sectionTitle: {
      ...typography.heading4,
      marginBottom: 16,
      color: colors.white.main
    },
    sectionWrapper: {
      borderBottomRightRadius: 12,
      borderBottomLeftRadius: 12,
      backgroundColor: colors.invariant.component,
      paddingTop: 0,
      width: '100%',
      marginBottom: 32
    },
    inputLabel: {
      ...typography.body3,
      lineHeight: '16px',
      color: colors.invariant.light,
      marginBottom: 3
    },
    selects: {
      gap: 12,
      marginBottom: 10
    },
    selectWrapper: {
      flex: '1 1 0%'
    },
    customSelect: {
      width: '100%',
      justifyContent: 'flex-start',
      border: 'none',
      backgroundColor: colors.invariant.componentBcg,
      borderRadius: 13,
      paddingInline: 13,
      height: 44,

      '& .selectArrow': {
        marginLeft: 'auto'
      },

      '&:hover': {
        backgroundColor: colors.invariant.light,
        '@media (hover: none)': {
          backgroundColor: colors.invariant.componentBcg
        }
      }
    },
    addButton: {
      width: '100%',
      margin: '30px 0',
      cursor: 'default'
    },
    hoverButton: {
      '&:hover': {
        filter: 'brightness(1.2)',
        boxShadow: `0 0 10px ${colors.invariant.pink}`,
        transition: '.2s all',
        cursor: 'pointer'
      }
    },
    arrows: {
      width: 32,
      cursor: 'pointer',

      '&:hover': {
        filter: 'brightness(2)',
        '@media (hover: none)': {
          filter: 'none'
        }
      }
    }
  }
})

export default useStyles
