import { toast } from 'react-toastify';

export function with_toast(promise) {
  toast.promise(promise, {
    pending: {
      render() {
        return (
          <div className="p-6 py-2">
            <p>Tx is being processed</p>
            <p>Please wait...</p>
          </div>)
      }, icon: false,
    },
    success: {
      render({ data }) { return (
        <div>
          <p className="font-bold">{data.transactionHash.slice(0, 20)}...</p>
          <p>Tx has been successfully processed</p>
          <a
            href={`https://ropsten.etherscan.io/tx/${data.transactionHash}`} 
            target="_blank">
              <i className='text-indigo-600 underline'>See tx on etherscan</i>
          </a>
        </div>
      )}
    },
    error: {
      render({ data }) { return <div> {data.message ?? "TX failed"}</div> }
    }
  },
  {
    closeButton: true
  })
}

export const create_course_hash = web3 => (courseId, account) => {
  const hexCourseId = web3.utils.utf8ToHex(courseId)
  const courseHash = web3.utils.soliditySha3(
    { type: "bytes16", value: hexCourseId },
    { type: "address", value: account }
  );

  return courseHash;
}

export async function load_contract_async(name, web3) {
  const response = await fetch(`/contracts/${name}.json`);
  const artifact = await response.json();
  const network_id = process.env.NEXT_PUBLIC_NETWORK_ID;
  let deployed = null;
  try {
    deployed = new web3.eth.Contract(artifact.abi, artifact.networks[network_id].address)
  }
  catch {
    console.error(`contract ${name} failed to load`);
  }

  return deployed;
}

export const COURSE_STATE = {
  0: "purchased",
  1: "activated",
  2: "deactivated",
}

export const normalize = web3 => (course, owned) => {
  return {
    ...course,
    ownedCourseId: owned.id,
    proof: owned.proof,
    owner: owned.owner,
    price: web3.utils.fromWei(owned.price),
    state: COURSE_STATE[owned.state]
  }
}
