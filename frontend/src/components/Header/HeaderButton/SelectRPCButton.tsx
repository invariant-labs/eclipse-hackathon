import React from 'react'
import useStyles from './style'
import { ISelectNetwork } from '@store/consts/types'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { Button } from '@mui/material'
import { SelectDevnetRPC } from '@components/Modals/SelectDevnetRPC/SelectDevnetRPC'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { NetworkType } from '@store/consts/static'

export interface IProps {
  rpc: string
  networks: ISelectNetwork[]
  onSelect: (networkType: NetworkType, rpcAddress: string, rpcName?: string) => void
  disabled?: boolean
}
export const SelectRPCButton: React.FC<IProps> = ({
  rpc,
  networks,
  onSelect,
  disabled = false
}) => {
  const { classes } = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [openTestnetRpcs, setOpenTestnetRpcs] = React.useState<boolean>(false)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setOpenTestnetRpcs(true)
  }

  const handleClose = () => {
    unblurContent()
    setOpenTestnetRpcs(false)
  }

  return (
    <>
      <Button
        className={classes.headerButton}
        variant='contained'
        classes={{ disabled: classes.disabled }}
        disabled={disabled}
        endIcon={<KeyboardArrowDownIcon id='downIcon' />}
        onClick={handleClick}>
        RPC
      </Button>
      <SelectDevnetRPC
        networks={networks}
        open={openTestnetRpcs}
        anchorEl={anchorEl}
        onSelect={onSelect}
        handleClose={handleClose}
        activeRPC={rpc}
      />
    </>
  )
}
export default SelectRPCButton
