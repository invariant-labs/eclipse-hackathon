import RoutesModal from '@components/Modals/RoutesModal'
import SelectTestnetRPC from '@components/Modals/SelectDevnetRPC/SelectDevnetRPC'
import NavbarButton from '@components/Navbar/Button'
import DotIcon from '@mui/icons-material/FiberManualRecordRounded'
import { Box, Button, CardMedia, Grid, IconButton, useMediaQuery } from '@mui/material'
import icons from '@static/icons'
import Hamburger from '@static/svg/Hamburger.svg'
import { theme } from '@static/theme'
import { NetworkType, RPC,  } from '@store/consts/static'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChangeWalletButton from './HeaderButton/ChangeWalletButton'
import SelectNetworkButton from './HeaderButton/SelectNetworkButton'
import SelectRPCButton from './HeaderButton/SelectRPCButton'
import useButtonStyles from './HeaderButton/style'
import useStyles from './style'
import { PublicKey } from '@solana/web3.js'
import { ISelectNetwork } from '@store/consts/types'

export interface IHeader {
  address: PublicKey
  onNetworkSelect: (networkType: NetworkType, rpcAddress: string, rpcName?: string) => void
  onConnectWallet: () => void
  walletConnected: boolean
  landing: string
  typeOfNetwork: NetworkType
  rpc: string
  onFaucet?: () => void
  onDisconnectWallet: () => void
  defaultTestnetRPC: string
}

export const Header: React.FC<IHeader> = ({
  address,
  onNetworkSelect,
  onConnectWallet,
  walletConnected,
  landing,
  typeOfNetwork,
  rpc,
  onFaucet,
  onDisconnectWallet,
  defaultTestnetRPC,
}) => {
  const { classes } = useStyles()
  const buttonStyles = useButtonStyles()
  const navigate = useNavigate()

  const isMdDown = useMediaQuery(theme.breakpoints.down('md'))

  const routes = ['exchange', 'liquidity', 'statistics']

  const otherRoutesToHighlight: Record<string, RegExp[]> = {
    liquidity: [/^newPosition\/*/, /^position\/*/],
    exchange: [/^exchange\/*/]
  }

  const [activePath, setActive] = useState('exchange')

  const [routesModalOpen, setRoutesModalOpen] = useState(false)
  const [testnetRpcsOpen, setTestnetRpcsOpen] = useState(false)
  const [routesModalAnchor, setRoutesModalAnchor] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    setActive(landing)
  }, [landing])

  const devnetRPCs: ISelectNetwork[] = [
    {
      networkType: NetworkType.DEVNET,
      rpc: RPC.DEV,
      rpcName: 'Eclipse'
    },
    {
      networkType: NetworkType.DEVNET,
      rpc: RPC.DEV_EU,
      rpcName: 'Eclipse EU'
    }
  ]


  return (
    <Grid container>
      <Grid container className={classes.root} direction='row' alignItems='center' wrap='nowrap'>
        <Grid
          container
          item
          className={classes.leftSide}
          justifyContent='flex-start'
          sx={{ display: { xs: 'none', md: 'block' } }}>
          <CardMedia
            className={classes.logo}
            image={icons.LogoTitle}
            onClick={() => {
              if (!activePath.startsWith('exchange')) {
                navigate('/exchange')
              }
            }}
          />
        </Grid>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Grid container item className={classes.leftSide} justifyContent='flex-start'>
            <Grid container>
              <CardMedia
                className={classes.logoShort}
                image={icons.LogoShort}
                onClick={() => {
                  if (!activePath.startsWith('exchange')) {
                    navigate('/exchange')
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
        <Grid
          container
          item
          className={classes.routers}
          wrap='nowrap'
          sx={{ display: { xs: 'none', lg: 'block' } }}>
          {routes.map(path => (
            <Link key={`path-${path}`} to={`/${path}`} className={classes.link}>
              <NavbarButton
                name={path}
                onClick={e => {
                  if (path === 'exchange' && activePath.startsWith('exchange')) {
                    e.preventDefault()
                  }

                  setActive(path)
                }}
                active={
                  path === activePath ||
                  (!!otherRoutesToHighlight[path] &&
                    otherRoutesToHighlight[path].some(pathRegex => pathRegex.test(activePath)))
                }
              />
            </Link>
          ))}
        </Grid>

        <Grid container item className={classes.buttons} wrap='nowrap'>
          <Grid container className={classes.leftButtons}>
            {typeOfNetwork === NetworkType.TESTNET ? (
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Button
                  className={buttonStyles.classes.headerButton}
                  variant='contained'
                  sx={{ '& .MuiButton-label': buttonStyles.classes.label }}
                  onClick={onFaucet}>
                  Faucet
                </Button>
              </Box>
            ) : null}
            {typeOfNetwork ===  NetworkType.TESTNET ? (
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SelectRPCButton rpc={rpc} networks={devnetRPCs} onSelect={onNetworkSelect} />
              </Box>
            ) : null}
            <SelectNetworkButton
              name={typeOfNetwork}
              networks={[
                {
                  networkType: NetworkType.TESTNET,
                  rpc: defaultTestnetRPC,
                  rpcName:
                    devnetRPCs.find(data => data.rpc === defaultTestnetRPC)?.rpcName ?? 'Custom'
                }
              ]}
              onSelect={onNetworkSelect}
            />
          </Grid>
          <ChangeWalletButton
            name={
              walletConnected
                ? `${address.toString().slice(0, 4)}...${
                    !isMdDown
                      ? address
                          .toString()
                          .slice(address.toString().length - 4, address.toString().length)
                      : ''
                  }`
                : 'Connect wallet'
            }
            onConnect={onConnectWallet}
            connected={walletConnected}
            onDisconnect={onDisconnectWallet}
            startIcon={
              walletConnected ? <DotIcon className={classes.connectedWalletIcon} /> : undefined
            }
          />
        </Grid>

        <Grid sx={{ display: { xs: 'block', lg: 'none' } }}>
          <IconButton
            className={classes.menuButton}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              setRoutesModalAnchor(event.currentTarget)
              setRoutesModalOpen(true)
              blurContent()
            }}>
            <CardMedia className={classes.menu} image={Hamburger} />
          </IconButton>
          <RoutesModal
            routes={routes}
            anchorEl={routesModalAnchor}
            open={routesModalOpen}
            current={activePath}
            onSelect={(selected: string) => {
              setActive(selected)
              setRoutesModalOpen(false)
              unblurContent()
            }}
            handleClose={() => {
              setRoutesModalOpen(false)
              unblurContent()
            }}
            onFaucet={typeOfNetwork === NetworkType.TESTNET && isMdDown ? onFaucet : undefined}
            onRPC={
              typeOfNetwork === NetworkType.TESTNET && isMdDown
                ? () => {
                    setRoutesModalOpen(false)
                    setTestnetRpcsOpen(true)
                  }
                : undefined
            }

          />
          {typeOfNetwork === NetworkType.TESTNET ? (
            <SelectTestnetRPC
              networks={devnetRPCs}
              open={testnetRpcsOpen}
              anchorEl={routesModalAnchor}
              onSelect={onNetworkSelect}
              handleClose={() => {
                setTestnetRpcsOpen(false)
                unblurContent()
              }}
              activeRPC={rpc}
            />
          ) : null}
        </Grid>
      </Grid>
    </Grid>
  )
}
export default Header
