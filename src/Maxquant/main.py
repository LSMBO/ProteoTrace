from Maxquant import Maxquant
import pickle
import argparse
import random, string
from Bio import SeqIO

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Maxquant result folder (txt folder)')
parser.add_argument('-f', help='Database used in the identification search')
parser.add_argument('-runID', help='Run id')
parser.add_argument('--protein-descriptions', help='Protein id', action='append')
args = parser.parse_args()

def strip_list(input_list):
    new_list = []
    for i in input_list:
        new_list.append(i[1:-2])
    return new_list

def description_to_id(protein_description):
    return protein_description.split(' ')[0]

    
if (args.r and args.f):
    result_folder = args.r
    fasta_file = args.f
    random_suffix = ''.join(random.choices(string.digits, k=4))
    output_file_pkl = f"tmp/Maxquant_proteotrace_{random_suffix}.pkl"
    output_file_txt = f"tmp/Maxquant_proteotrace_protein_list_{random_suffix}.txt"
    
    maxquant = Maxquant(result_folder, fasta_file)
    with open(output_file_pkl, 'wb') as pkl_file:
        pickle.dump(maxquant, pkl_file)
    
    protein_description_all = [record.description for record in SeqIO.parse(fasta_file, "fasta")]
    print(f"RUN_ID={random_suffix}")
  
    with open(output_file_txt, 'w') as output_file:
        for protein_description in protein_description_all:
            output_file.write(f"{protein_description}\n")
    
elif (args.runID):
    args.runID = args.runID[:-2]
    args.protein_descriptions = strip_list(args.protein_descriptions)
    pkl_file = f"tmp/Maxquant_proteotrace_{args.runID}.pkl"
    with open(pkl_file, 'rb') as pkl_file:
        maxquant = pickle.load(pkl_file)
    result_folder = maxquant.result_folder
    fasta_file = maxquant.fasta_file
    maxquant = Maxquant(result_folder, fasta_file, args.protein_descriptions)

    for protein_description in args.protein_descriptions:
        found = False
        for maxquant_protein in maxquant.proteins:
            if maxquant_protein.description == protein_description:
                found = True
                maxquant_protein_transformed_id = maxquant_protein.id.replace('|', '##')
                coverage_file=f"tmp/Maxquant_proteotrace_{args.runID}_{maxquant_protein_transformed_id}_coverage.txt"
                maxquant_protein.get_sequence_coverage(coverage_file)
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=TRUE")
                print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@COVERAGE_FILE={coverage_file}")
                break
        if not found:
            print(f"LOG=PROTEIN_ID={description_to_id(protein_description)}@@IDENTIFIED=FALSE")
