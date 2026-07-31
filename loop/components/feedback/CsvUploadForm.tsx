"use client";

import { useState } from "react";

type Props = {
  onUploaded?: () => void;
};

export default function CsvUploadForm({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);


  async function uploadCSV() {

    if (!file) {
      setMessage("Please select CSV file");
      return;
    }


    setLoading(true);
    setMessage("");
    setErrors([]);


    try {

      const formData = new FormData();

      formData.append(
        "file",
        file
      );


      const response = await fetch(
        "/api/feedback/upload",
        {
          method: "POST",
          body: formData,
        }
      );


      const result = await response.json();


      console.log("UPLOAD RESULT:", result);



      if(result.success){

        setMessage(
          `${result.inserted} feedback imported successfully`
        );


        if(result.errors?.length){
          setErrors(result.errors);
        }


        // refresh feedback list
        if(onUploaded){
          onUploaded();
        }


      }
      else{

        setMessage(
          result.message || "Upload failed"
        );

      }



    }
    catch(error){

      console.error(error);

      setMessage(
        "Upload failed"
      );

    }
    finally{

      setLoading(false);

    }

  }



  return (

    <div className="space-y-4">


      <input

        type="file"

        accept=".csv"

        onChange={(e)=>
          setFile(
            e.target.files?.[0] || null
          )
        }

        className="block w-full text-sm"

      />


      {
        file && (

          <p className="text-sm">
            Selected:
            <b> {file.name}</b>
          </p>

        )
      }



      <button

        onClick={uploadCSV}

        disabled={loading}

        className="
        rounded-lg
        bg-black
        px-5
        py-2
        text-white
        "

      >

        {
          loading
          ?
          "Uploading..."
          :
          "Upload CSV"
        }


      </button>



      {
        message && (

          <p className="text-sm font-medium">
            {message}
          </p>

        )
      }



      {
        errors.length > 0 && (

          <div className="text-sm text-red-600">

            {
              errors.map(
                (e,i)=>(

                  <p key={i}>
                    Row {e.row}: {e.error}
                  </p>

                )
              )
            }

          </div>

        )
      }


    </div>

  );

}