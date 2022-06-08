import { useHooks, useWeb3 } from "@components/providers/web3"
import { useRouter } from "next/router"
import { useEffect } from "react"

export const useAdmin = ({redirectTo}) => {
  const { account } = useAccount()
  const { requireInstall } = useWeb3()
  const router = useRouter()

  useEffect(() => {
    if ((
      requireInstall ||
      account.has_init_response && !account.isAdmin)) {

      router.push(redirectTo)
    }
  }, [account])

  return { account }
}

const enhanceHook = (swrResponse) => {
  return {
    ...swrResponse,
    has_init_response: swrResponse.data || swrResponse.error
  }
}

export const useAccount = () => {
  const swr = enhanceHook(useHooks(hooks => hooks.useAccount)())

  return {
    account: swr
  }
}

export const useNetwork = () => {
  const swr = enhanceHook(useHooks(hooks => hooks.useNetwork)())

  return {
    network: swr
  }
}

export const useWalletInfo = () => {
  const { account } = useAccount();
  const { network } = useNetwork();

  const is_connecting = !account.has_init_response && !network.has_init_response;

  const has_connected_wallet = !!(account.data && network.is_supported);

  return { 
    account, 
    network, 
    is_connecting,
    has_connected_wallet 
  }
}

export const useManagedCourses = (...args) => {
  const swrRes = enhanceHook(useHooks(hooks => hooks.useManagedCourses)(...args))

  return {
    managedCourses: swrRes
  }
}

export const useOwnedCourse = (...args) => {
  const swrRes = enhanceHook(useHooks(hooks => hooks.useOwnedCourse)(...args))

  return {
    ownedCourse: swrRes
  }
}

export function useOwnedCourses(...args) {
  const res = enhanceHook(useHooks(hooks => hooks.useOwnedCourses)(...args));
  
  return {
    ownedCourses: res
  }
}