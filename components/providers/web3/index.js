import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from "web3";
import {setupHooks} from "@components/providers/web3/hooks/setupHooks";
import { load_contract_async } from '../../../utils/utils';

const { createContext, useContext, useState, useEffect, useMemo} = require("react");
const Web3Context = createContext(null);

const setListeners = provider => {
  provider?.on("chainChanged", _ => window.location.reload())
}

function createWeb3State(web3, provider, contract, isLoading) {
  return {
    web3, 
    provider, 
    contract, 
    isLoading, 
    hooks: setupHooks(web3, provider, contract)
  }
}

export default function Web3Provider({children}) {

  const [web3_api, set_web3_api] = useState(
    createWeb3State(null, null, null, true)
  );

  useEffect(() => {
    async function load_provider() {
      const provider = await detectEthereumProvider();

      if (!provider) {
        set_web3_api({...web3_api, loading: false});
      }

      //setAccountListner(provider);
      const web3 = new Web3(provider);
      const contract = await load_contract_async("CourseMarketplace", web3);

      setListeners(provider);
      set_web3_api(createWeb3State(web3, provider, contract,false));
    }

    load_provider();
  }, [])

  const web3_api_memo = useMemo(() => {
    return {
      ...web3_api,
      //is_web3_ready: web3_api != null,
      require_install: !web3_api.isLoading && ! web3_api.web3,
      connect: web3_api.provider ? 
        async() => {
          try {
            await web3_api.provider.request({ method: "eth_requestAccounts"});
          }
          catch {
            window.location.reload();
          }
        } :
        () => console.log("Cannot connect to Metamask. Refresh.") 
    }
  }, [web3_api])

  return (
    <Web3Context.Provider value={web3_api_memo}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  return useContext(Web3Context);
}

export function useHooks(cb) {
  const { hooks } = useWeb3()
  return cb(hooks)
}