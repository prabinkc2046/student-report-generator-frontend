"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        onDrop: (acceptedFiles) => {
            if (acceptedFiles[0]) {
                setFile(acceptedFiles[0])
            }
        },
        multiple: false
    })

    const handleRemoveFile = () => {
        setFile(null)
    }

    const handleUpload = async () => {
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('http://localhost:5001/parse', {
            method: 'POST',
            body: formData
        });

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'students.txt'
        a.click();
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Parse Student Records</CardTitle>
                    <CardDescription>
                        Upload PDF to extract student data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragActive
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="space-y-2">
                            <p className="text-4xl">📄</p>
                            <p className="text-sm font-medium">
                                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                or click to browse
                            </p>
                        </div>
                    </div>

                    {file && (
                        <div className="p-4 bg-muted rounded-lg border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Selected file</p>
                                    <p className="font-medium mt-1">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={!file}
                        className="w-full py-6 text-base font-semibold"
                        size="lg"
                    >
                        Upload & Extract
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}