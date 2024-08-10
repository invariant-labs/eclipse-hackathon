import { Tooltip } from '@mui/material'
import useStyles from './style'
import { TooltipTransition } from './TooltipTransition/TooltipTransition'

type Props = {
  text: string
  children: React.ReactElement<any, any>
}

export const TooltipHover = ({ text, children }: Props) => {
  const { classes } = useStyles()

  return (
    <Tooltip
      classes={{ tooltip: classes.tooltip }}
      title={text}
      placement='top'
      TransitionComponent={TooltipTransition}>
      {children}
    </Tooltip>
  )
}
